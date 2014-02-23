/** @jsx React.DOM */

"use strict";

var hexfile = document.getElementById('hexfile');
var terminal = document.getElementById('terminal');
var addhex  = document.getElementById('addhex');
var runstop = document.getElementById('runstop');
var monrun  = document.getElementById('monrun');
var resetButton = document.getElementById('resetButton');

Uint8Array.prototype.clear = function() { this.set(new Array(this.length)); };

var ExternalROM = new Uint8Array(0x8000); // EPROM
var ExternalRAM = new Uint8Array(0x8000); // RAM
var InternalRAM = new Uint8Array(0x100);

var Modes = { MON: 0, RUN: 1 };
var Mode = Modes.MON;

var getMemLoc = function (addr) {
  var subAddr = addr & 0x7FFF;
  if ((Mode === Modes.MON) ^ (addr > 0x7FFF)) {
    return ExternalROM[subAddr];
  }
  return ExternalRAM[subAddr];
};

var setMemLoc = function (addr, newVal) {
  var subAddr = addr & 0x7FFF;
  if ((Mode === Modes.MON) ^ (addr > 0x7FFF)) {
    ExternalROM[subAddr] = newVal;
  } else {
    ExternalRAM[subAddr] = newVal;
  }
};

// See http://www.edsim51.com/8051Notes/8051/memory.html

var runState = false;
var runSpeed = 500; // in steps per second

var verbose = true;
var log = function() {
  if (verbose) {
    console.log.apply(console, arguments);
  }
};

var strToHex = function (n) { return parseInt(n, 16); };
var intToHexStr = function (n, minBits) { 
  minBits = minBits || 0;
  var hex = new Array(minBits + 1).join('0');
  hex += n.toString(16).toUpperCase();
  return minBits ? hex.substr(hex.length - minBits) : hex;
  
};
var intToByteStr = function (n) {
  return intToHexStr(n, 2);
};
var byteToBits = function (n) { 
  return [0,1,2,3,4,5,6,7].map(function (i) { return (n >> i) & 1; });
};

var defineByte = function (varName, memorySpace, addr) {
  Object.defineProperty(window, varName, {
    get: function () { return memorySpace[addr]; },
    set: function (val) { memorySpace[addr] = val; }
  });
};

var bitProps = function (varName, n) {
  return {
    get: function () {
      return (window[varName] >> n) & 1;
    },
    set: function (val) {
      if (val) {
        window[varName] |= (1 << n);
      } else {
        window[varName] &= 0xFF - (1 << n);
      }
    }
  };
};

var defineBit = function (varName, byteName, bit) {
  Object.defineProperty(window, varName, bitProps(byteName, bit));
};

var R0, R1, R2, R3, R4, R5, R6, R7;
var P0, SP, DPL, DPH, DPTR, PCON, TCON, TMOD, TL0, TL1, TH0, TH1, P1, SCON;
var P2, IE, P3, IP, PSW, ACC, A, B, PCL, PCH, PC, SBUF;
var C, CY, AC, F0, RS1, RS0, OV, P, SMOD, GF1, GF0, PD, IDL, EA, ET2, ES, ET1;
var EX1, ET0, EX0, PT2, PS, PT1, PX1, PT0, PX0, TF1, TR1, TF0, TR0, IE1, IT1;
var IE0, IT0, SM0, SM1, SM2, REN, TB8, RB8, TI, RI;

// And now, we begin to define the internal memory structure.

// Define the registers, R0 through R7. Their locations depend on
// RS1 and RS0, but register banks 0-3 take up 0x00 - 0x1F.
// Without modification, the Stack Pointer begins at 0x07, so as to
// overwrite the higher register banks as necessary.
[0,1,2,3,4,5,6,7].forEach(function (i) {
  Object.defineProperty(window, 'R' + i, {
    get: function () { return InternalRAM[RS1 * 16 + RS0 * 8 + i]; },
    set: function (val) { InternalRAM[RS1 * 16 + RS0 * 8 + i] = val; }
  });
});

// Bytes 0x20-0x2F are bit addressable for general bit variables,
// while many variables above 0x80 are also bit addressable.
// Bytes 0x30 - 0x7F are left as General Purpose RAM

defineByte('P0', InternalRAM, 0x80);
defineByte('SP', InternalRAM, 0x81);
defineByte('DPL', InternalRAM, 0x82);
defineByte('DPH', InternalRAM, 0x83);
// DPTR is just 0x[DPH][DPL].
Object.defineProperty(window, 'DPTR', {
  get: function () { return (DPH << 8) + DPL; },
  set: function (val) { 
    DPH = val >> 8;
    DPL = val % 0x100;
  }
});

defineByte('PCON', InternalRAM, 0x87);
defineByte('TCON', InternalRAM, 0x88);
defineByte('TMOD', InternalRAM, 0x89);
defineByte('TL0', InternalRAM, 0x8A);
defineByte('TL1', InternalRAM, 0x8B);
defineByte('TH0', InternalRAM, 0x8C);
defineByte('TH1', InternalRAM, 0x8D);

defineByte('P1', InternalRAM, 0x90);

defineByte('SCON', InternalRAM, 0x98);
Object.defineProperty(window, 'SBUF', {
  get: function () { return InternalRAM[0x99]; },
  set: function (val) { 
    if (window.debug) {
      debugger;
    }
    InternalRAM[0x99] = val; 
    if (!terminal.keydown) {
      terminal.sndchr(val); 
    }
  }
});

var updateOnSBUFWrite = function (addr) {
  if (addr === 0x99) {
    SBUF = SBUF;
  }
};

defineByte('P2', InternalRAM, 0xA0);

defineByte('IE', InternalRAM, 0xA8);

defineByte('P3', InternalRAM, 0xB0);

defineByte('IP', InternalRAM, 0xB8);

defineByte('PSW', InternalRAM, 0xD0);

defineByte('ACC', InternalRAM, 0xE0);
defineByte('A', InternalRAM, 0xE0);

defineByte('B', InternalRAM, 0xF0);

// These aren't technically defined within the 
defineByte('PCL', InternalRAM, 0xFE);
defineByte('PCH', InternalRAM, 0xFF);
Object.defineProperty(window, 'PC', {
  get: function () { return (PCH << 8) + PCL; },
  set: function (val) { 
    PCH = val >> 8;
    PCL = val % 0x100;
  }
});

// The bits in the SFR usually have names, so we assign those.
defineBit('C',    'PSW',  7); // bit D7
defineBit('CY',   'PSW',  7); // bit D7
defineBit('AC',   'PSW',  6); // bit D6
defineBit('F0',   'PSW',  5); // bit D5
defineBit('RS1',  'PSW',  4); // bit D4
defineBit('RS0',  'PSW',  3); // bit D3
defineBit('OV',   'PSW',  2); // bit D2
defineBit('P',    'PSW',  0); // bit D0

defineBit('SMOD', 'PCON', 7);
defineBit('GF1',  'PCON', 3);
defineBit('GF0',  'PCON', 2);
defineBit('PD',   'PCON', 1);
defineBit('IDL',  'PCON', 0);

defineBit('EA',   'IE',   7); // bit AF
defineBit('ET2',  'IE',   5); // bit AD
defineBit('ES',   'IE',   4); // bit AC
defineBit('ET1',  'IE',   3); // bit AB
defineBit('EX1',  'IE',   2); // bit AA
defineBit('ET0',  'IE',   1); // bit A9
defineBit('EX0',  'IE',   0); // bit A8

defineBit('PT2',  'IP',   5); // bit BD
defineBit('PS',   'IP',   4); // bit BC
defineBit('PT1',  'IP',   3); // bit BB
defineBit('PX1',  'IP',   2); // bit BA
defineBit('PT0',  'IP',   1); // bit B9
defineBit('PX0',  'IP',   0); // bit B8

defineBit('TF1',  'TCON', 7); // bit 8F
defineBit('TR1',  'TCON', 6); // bit 8E
defineBit('TF0',  'TCON', 5); // bit 8D
defineBit('TR0',  'TCON', 4); // bit 8C
defineBit('IE1',  'TCON', 3); // bit 8B
defineBit('IT1',  'TCON', 2); // bit 8A
defineBit('IE0',  'TCON', 1); // bit 89
defineBit('IT0',  'TCON', 0); // bit 88

defineBit('SM0',  'SCON', 7); // bit 9F
defineBit('SM1',  'SCON', 6); // bit 9E
defineBit('SM2',  'SCON', 5); // bit 9D
defineBit('REN',  'SCON', 4); // bit 9C
defineBit('TB8',  'SCON', 3); // bit 9B
defineBit('RB8',  'SCON', 2); // bit 9A
defineBit('TI',   'SCON', 1); // bit 99
defineBit('RI',   'SCON', 0); // bit 98
/**
 * var opcodeArgTypes = {
 *   'Rn': 0, // R7 - R0 [I don't think this is a legit argument]
 *   'direct': 0,  // 8-bit internal data location's address. 
 * This could be Internal Data RAM [0-127] or a SFR [128-255].
 *   '@Ri': 0, // 8-bit internal data RAM location (0-255) addressed indirectly 
 * through register R1 or R0.
 *   '#data': 0,     // 8-bit constant included in instruction
 *   '#data 16': 0,  // 16-bit constant included in instruction
 *   'addr 16': 0,   // 16-bit destination address. Used by LCALL & LJMP. 
 * A branch can be anywhere within the 64K-byte Program Memory Address Space.
 *   'addr 11': 0,   // 11-bit destination address. Used by ACALL & AJMP. The 
 * branch will be within the same 2K-byte page of program memory as the first 
 * byte of the following instruction.
 *   'rel': 0,       // Signed (two's complement) 8-bit offset byte. Used by 
 * SJMP and all conditional jumps. Range is -128 to +127 bytes relative to the 
 * first byte of the following instruction.
 *   'bit': 0,       // Direct Addressed bit in Internal Data RAM or SFR.
 * };
 */
 
/*****
 * TODO:
 * - Understand memory layout.
 * - Write register bank system.
 * - Have parity bit perform automatically
 * - Write interpretation methods
 * - Figure out @ Ri.
 *
 * Also, this is helpful:
 * http://www.edsim51.com/8051Notes/8051/memory.html
 */

// var LightBank = React.createClass({
  // render: function () {
    // var byte = this.props.byte;
    // var lightBulbs = [7, 6, 5, 4, 3, 2, 1, 0].map(function (i) {
      // var bit = byte[i];
      // return (<span className={bit ? "on" : "off"}>{bit}</span>);
    // });
    // return (
      // <div className="lightBank">
        // {lightBulbs}
      // </div>
    // );
  // }
// });

// React.renderComponent(
  // <LightBank byte={P0_} />, 
  // document.getElementById('lightBank')
// );

var opcodeByteCounts = [
//  0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
    1, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0x0_
    3, 2, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0x1_
    3, 2, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0x2_
    3, 2, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0x3_
    2, 2, 2, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0x4_
    2, 2, 2, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0x5_
    2, 2, 2, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0x6_
    2, 2, 2, 1, 2, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, // 0x7_
    2, 2, 2, 1, 1, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, // 0x8_
    3, 2, 2, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0x9_
    2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, // 0xA_
    2, 2, 2, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, // 0xB_
    2, 2, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0xC_
    2, 2, 2, 1, 1, 3, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, // 0xD_
    1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0xE_
    1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1  // 0xF_
];

var readOpcodeAndArgs = function () {
  var op = getMemLoc(PC);
  var args = [];
  var i;
  for (i = 1; i < opcodeByteCounts[op]; i++) {
    args.push(getMemLoc(PC + i));
  }
  return [op, args];
};

var printMemoryHead = function (mem) {
  mem = mem || ExternalRAM;
  var str = '';
  str += '\nMemory head:\n';
  str += '\t |\t0\t1\t2\t3\t4\t5\t6\t7\t8\t9\tA\tB\tC\tD\tE\tF\n';
  str += '-----------------------------------';
  str += '-----------------------------------\n'; 
  str += [].slice
            .apply(mem.subarray(0,0xFF))
            .map(intToByteStr).join('\t').match(/(\w+\t){16}/g)
            .map(function (x, i) { 
              return '0x' + intToHexStr(i) + '_ |\t' + x; 
            }).join('\n');
  str += '\n';
  log(str);
};

var fillMemoryFromHex = function () {
  ExternalRAM.clear();
  if (!hexfile.value) {
    return;
  }
  var hexLines = hexfile.value.substr(1).split('\n:');
  hexLines.forEach(function (line, lineNum) {
    log('Running on line ' + lineNum);
    var bytes = line.match(/\w\w/g);
    if (bytes.map(strToHex).reduce(function(a, b) { return a + b; }) % 256) {
      // Failed the checksum
      log('Checksum failed on line ' + lineNum + '!');
      // return;
    }
    var recordLength = strToHex(bytes[0]);
    var loadAddress = strToHex(bytes[1] + bytes[2]);
    var recordType = strToHex(bytes[3]);
    if (recordType === 1) {
      log('End record type detected!');
      return;
    }
    PC = (loadAddress) % 0x10000;
    var i;
    for (i = 4; i < 4 + recordLength; i++) {
      setMemLoc(PC, strToHex(bytes[i]));
      PC = PC + 1;
    }
  });
  printMemoryHead();
  PC = 0;
};

addhex.onclick = fillMemoryFromHex;

var nextPC = function (opcode) {
  PC = PC + opcodeByteCounts[opcode];
};

// This is faster.
var parityCounts = [
  0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 
  1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 
  1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 
  0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 
  1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 
  0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 
  0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 
  1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 
  1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 
  0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 
  0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 
  1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 
  0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 
  1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 
  1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 
  0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0
];
var updateParityBit = function () {
  P = parityCounts[A];
};

var getBitAddr = function (bitAddr) {
  if (bitAddr < 0x80) {
    return [0x20 + (bitAddr >> 3), bitAddr % 8];
  }
  return [(bitAddr >> 3) << 3, bitAddr % 8];
};

var getBit = function (bitAddr) {
  var addr = getBitAddr(bitAddr); // [byteAddr, bitNum]
  var byteVal = InternalRAM[addr[0]];
  return (byteVal >> addr[1]) & 1;
};

var setBit = function (bitAddr, newVal) {
  var addr = getBitAddr(bitAddr); // [byteAddr, bitNum]
  if (newVal) {
    InternalRAM[addr[0]] |= (1 << addr[1]);
  } else {
    InternalRAM[addr[0]] &= 0xFF - (1 << addr[1]);
  }
};

Object.defineProperty(window, 'AtR0', {
  get: function () { return InternalRAM[R0]; },
  set: function (val) { InternalRAM[R0] = val; }
});

Object.defineProperty(window, 'AtR1', {
  get: function () { return InternalRAM[R1]; },
  set: function (val) { InternalRAM[R1] = val; }
});

var updateState = function () {
  var P1Bulbs = [].slice.apply(
    document.querySelectorAll('.lightBank.P1 .lightBulb')
  ).reverse();
  var bits = byteToBits(P1);
  P1Bulbs.forEach(function (bulb, i) {
    var val = bits[i];
    if (bulb.innerText !== val.toString()) {
      bulb.classList.remove(val ? 'off' : 'on');
      bulb.innerText = val;
      bulb.classList.add(val ? 'on' : 'off');
    }
  });
};

var argsToDirect = function (arg) { return InternalRAM[arg]; };
var argsToData = function (arg) { return arg; };
var argsToData16 = function (arg, arg2) { return (arg << 8) + arg2; };
var argsToAddr16 = function (arg, arg2) { return (arg << 8) + arg2; };
// var argsToAddr11 = function (arg, arg2) { return (arg << 8) + arg2; }; //TODO
var argsToRel = function (arg) { return ((arg + 128) % 256) - 128; };
var argsToBit = getBit;
var getRnName = function (opcode) { return 'R' + (opcode % 8); };
var getRn = function (opcode) { return window[getRnName(opcode)]; };
var getAtRnName = function (opcode) { return (opcode & 1) ? 'AtR1' : 'AtR0'; };
var getAtRn = function (opcode) { return window[getAtRnName(opcode)]; };
var getCarryBits = function () {
  var args = [].slice.apply(arguments);
  return [0, 1, 2, 3, 4, 5, 6, 7].map(function(i) {
    return args.map(function(a) { return a & ((1 << i) - 1); })
      .reduce(function (a, b) {
      return a + b;
    }) > ((1 << i) - 1);
  });
};

var stepInstruction = function () {
  updateParityBit();
  var nextOpAndArgs = readOpcodeAndArgs();
  var opcode = nextOpAndArgs[0];
  var args   = nextOpAndArgs[1];
  log(
    'PC is at byte 0x' + intToHexStr(PC, 4) + ': opcode ' + 
    intToByteStr(opcode) + ' [' + args.map(intToByteStr).join(', ') + ']'
  );
  var tmp = {};
  var loadNextPC = true;
  if (window.debug) {
    debugger;
  }
  switch (opcode) {
    case 0x11: // ACALL page0
    case 0x31: // ACALL page1
    case 0x51: // ACALL page2
    case 0x71: // ACALL page3
    case 0x91: // ACALL page4
    case 0xB1: // ACALL page5
    case 0xD1: // ACALL page6
    case 0xF1: // ACALL page7
      // TODO: ACALL
      break;
    case 0x24: // ADD A, #data
      tmp.carryBits = getCarryBits(A, argsToData(args[0]));
      C = tmp.carryBits[7];
      AC = tmp.carryBits[3];
      OV = tmp.carryBits[6] ^ tmp.carryBits[7];
      A = A + argsToData(args[0]);
      break;
    case 0x25: // ADD A, iram
      tmp.carryBits = getCarryBits(A, argsToDirect(args[0]));
      C = tmp.carryBits[7];
      AC = tmp.carryBits[3];
      OV = tmp.carryBits[6] ^ tmp.carryBits[7];
      A = A + argsToDirect(args[0]);
      break;
    case 0x26: // ADD A, @Rn
    case 0x27:
      tmp.carryBits = getCarryBits(A, getAtRn(opcode));
      C = tmp.carryBits[7];
      AC = tmp.carryBits[3];
      OV = tmp.carryBits[6] ^ tmp.carryBits[7];
      A = A + getAtRn(opcode);
      break;
    case 0x28: // ADD A, R0
    case 0x29: // ADD A, R1
    case 0x2A: // ADD A, R2
    case 0x2B: // ADD A, R3
    case 0x2C: // ADD A, R4
    case 0x2D: // ADD A, R5
    case 0x2E: // ADD A, R6
    case 0x2F: // ADD A, R7
      tmp.carryBits = getCarryBits(A, getRn(opcode));
      C = tmp.carryBits[7];
      AC = tmp.carryBits[3];
      OV = tmp.carryBits[6] ^ tmp.carryBits[7];
      A = A + getRn(opcode);
      break;
    case 0x34: // ADDC A, #data
      tmp.carryBits = getCarryBits(A, C, argsToData(args[0]));
      C = tmp.carryBits[7];
      AC = tmp.carryBits[3];
      OV = tmp.carryBits[6] ^ tmp.carryBits[7];
      A = A + C + argsToData(args[0]);
      break;
    case 0x35: // ADDC A, iram
      tmp.carryBits = getCarryBits(A, C, argsToDirect(args[0]));
      C = tmp.carryBits[7];
      AC = tmp.carryBits[3];
      OV = tmp.carryBits[6] ^ tmp.carryBits[7];
      A = A + C + argsToDirect(args[0]);
      break;
    case 0x36: // ADDC A, @R0
    case 0x37: // ADDC A, @R1
      // AtRn = (opcode & 1) ? AtR1 : AtR0;
      tmp.carryBits = getCarryBits(A, C, getAtRn(opcode));
      C = tmp.carryBits[7];
      AC = tmp.carryBits[3];
      OV = tmp.carryBits[6] ^ tmp.carryBits[7];
      A = A + C + getAtRn(opcode);
      break;
    case 0x38: // ADDC A, Rn
    case 0x39: // ADDC A, R1
    case 0x3A: // ADDC A, R2
    case 0x3B: // ADDC A, R3
    case 0x3C: // ADDC A, R4
    case 0x3D: // ADDC A, R5
    case 0x3E: // ADDC A, R6
    case 0x3F: // ADDC A, R7
      tmp.carryBits = getCarryBits(A, C, getRn(opcode));
      C = tmp.carryBits[7];
      AC = tmp.carryBits[3];
      OV = tmp.carryBits[6] ^ tmp.carryBits[7];
      A = A + C + getRn(opcode);
      break;
    case 0x01: // AJMP page0
    case 0x21: // AJMP page1
    case 0x41: // AJMP page2
    case 0x61: // AJMP page3
    case 0x81: // AJMP page4
    case 0xA1: // AJMP page5
    case 0xC1: // AJMP page6
    case 0xE1: // AJMP page7
      // TODO: AJMP
      break;
    case 0x52: // ANL iram, A
      InternalRAM[args[0]] = argsToDirect(args[0]) & A;
      updateOnSBUFWrite(args[0]);
      break;
    case 0x53: // ANL iram, #data
      InternalRAM[args[0]] = argsToDirect(args[0]) & argsToData(args[1]);
      updateOnSBUFWrite(args[0]);
      break;
    case 0x54: // ANL A, #data
      A = A & argsToData(args[0]);
      break;
    case 0x55: // ANL A, iram
      A = A & argsToDirect(args[0]);
      break;
    case 0x56: // ANL A, @R0
    case 0x57: // ANL A, @R1
      A = A & getAtRn(opcode);
      break;
    case 0x58: // ANL A, R0
    case 0x59: // ANL A, R1
    case 0x5A: // ANL A, R2
    case 0x5B: // ANL A, R3
    case 0x5C: // ANL A, R4
    case 0x5D: // ANL A, R5
    case 0x5E: // ANL A, R6
    case 0x5F: // ANL A, R7
      A = A & getRn(opcode);
      break;
    case 0x82: // ANL C, bit
      C = C & argsToBit(args[0]);
      break;
    case 0xB0: // ANL C, !bit
      C = C & !argsToBit(args[0]);
      break;
    case 0xB4: // CJNE A, #data, rel
      nextPC(opcode);
      loadNextPC = false;
      if (A !== argsToData(args[0])) {
        PC = PC + argsToRel(args[1]);
      }
      C = A < argsToData(args[0]);
      break;
    case 0xB5: // CJNE A, iram, rel
      nextPC(opcode);
      loadNextPC = false;
      if (A !== argsToDirect(args[0])) {
        PC = PC + argsToRel(args[1]);
      }
      C = A < argsToDirect(args[0]);
      break;
    case 0xB6: // CJNE @R0, iram, rel
    case 0xB7: // CJNE @R1, iram, rel
      nextPC(opcode);
      loadNextPC = false;
      if (getAtRn(opcode) !== argsToData(args[0])) {
        PC = PC + argsToRel(args[1]);
      }
      C = getAtRn(opcode) < argsToData(args[0]);
      break;
    case 0xB8: // CJNE R0, #data, rel
    case 0xB9: // CJNE R1, #data, rel
    case 0xBA: // CJNE R2, #data, rel
    case 0xBB: // CJNE R3, #data, rel
    case 0xBC: // CJNE R4, #data, rel
    case 0xBD: // CJNE R5, #data, rel
    case 0xBE: // CJNE R6, #data, rel
    case 0xBF: // CJNE R7, #data, rel
      nextPC(opcode);
      loadNextPC = false;
      if (getRn(opcode) !== argsToData(args[0])) {
        PC = PC + argsToRel(args[1]);
      }
      C = getRn(opcode) < argsToData(args[0]);
      break;
    case 0xC2: // CLR bit
      setBit(args[0], 0);
      break;
    case 0xC3: // CLR C
      C = 0;
      break;
    case 0xE4: // CLR A
      A = 0;
      break;
    case 0xF4: // CPL A
      A = ~A;
      break;
    case 0xB3: // CPL C
      C = 1 - C;
      break;
    case 0xB2: // CPL bit
      setBit(args[0], !getBit(args[0]));
      break;
    case 0xD4: // DA A
      // TODO: DA
      break;
    case 0x14: // DEC A
      A = A - 1;
      break;
    case 0x15: // DEC iram
      InternalRAM[args[0]] -= 1;
      updateOnSBUFWrite(args[0]);
      break;
    case 0x16: // DEC @R0
    case 0x17: // DEC @R1
      window[getAtRnName(opcode)] -= 1;
      break;
    case 0x18: // DEC R0
    case 0x19: // DEC R1
    case 0x1A: // DEC R2
    case 0x1B: // DEC R3
    case 0x1C: // DEC R4
    case 0x1D: // DEC R5
    case 0x1E: // DEC R6
    case 0x1F: // DEC R7
      window[getRnName(opcode)] -= 1;
      break;
    case 0x84: // DIV AB
      C = 0;
      OV = (B === 0);
      tmp.rem = A % B;
      tmp.div = (A - tmp.rem) / B;
      A = tmp.div;
      B = tmp.rem;
      break;
    case 0xD5: // DJNZ iram, rel
      nextPC(opcode);
      loadNextPC = false;
      InternalRAM[args[0]] -= 1;
      updateOnSBUFWrite(args[0]);
      if (InternalRAM[args[0]]) {
        PC = PC + argsToRel(args[1]);
      }
      break;
    case 0xD8: // DJNZ R0, rel
    case 0xD9: // DJNZ R1, rel
    case 0xDA: // DJNZ R2, rel
    case 0xDB: // DJNZ R3, rel
    case 0xDC: // DJNZ R4, rel
    case 0xDD: // DJNZ R5, rel
    case 0xDE: // DJNZ R6, rel
    case 0xDF: // DJNZ R7, rel
      nextPC(opcode);
      loadNextPC = false;
      window[getRnName(opcode)] -= 1;
      if (getRn(opcode)) {
        PC = PC + argsToRel(args[1]);
      }
      break;
    case 0x04: // INC A
      A = A + 1;
      break;
    case 0x05: // INC iram
      InternalRAM[args[0]]++;
      updateOnSBUFWrite(args[0]);
      break;
    case 0x06: // INC @R0
    case 0x07: // INC @R1
      window[getAtRnName(opcode)]++;
      break;
    case 0x08: // INC R0
    case 0x09: // INC R1
    case 0x0A: // INC R2
    case 0x0B: // INC R3
    case 0x0C: // INC R4
    case 0x0D: // INC R5
    case 0x0E: // INC R6
    case 0x0F: // INC R7
      window[getRnName(opcode)]++;
      break;
    case 0xA3: // INC DPTR
      DPTR++;
      break;
    case 0x20: // JB bit, rel
      nextPC(opcode);
      loadNextPC = false;
      if (argsToBit(args[0])) {
        PC = PC + argsToRel(args[1]);
      }
      break;
    case 0x10: // JBC bit, rel
      nextPC(opcode);
      loadNextPC = false;
      if (argsToBit(args[0])) {
        setBit(args[0], 0);
        PC = PC + argsToRel(args[1]);
      }
      break;
    case 0x40: // JC rel
      nextPC(opcode);
      loadNextPC = false;
      if (C) {
        PC = PC + argsToRel(args[0]);
      }
      break;
    case 0x73: // JMP
      PC = A + DPTR;
      break;
    case 0x30: // JNB bit, rel
      nextPC(opcode);
      loadNextPC = false;
      if (!argsToBit(args[0])) {
        PC = PC + argsToRel(args[1]);
      }
      break;
    case 0x50: // JNC rel
      nextPC(opcode);
      loadNextPC = false;
      if (!C) {
        PC = PC + argsToRel(args[0]);
      }
      break;
    case 0x70: // JNZ rel
      nextPC(opcode);
      loadNextPC = false;
      if (A) {
        PC = PC + argsToRel(args[0]);
      }
      break;
    case 0x60: // JZ rel
      nextPC(opcode);
      loadNextPC = false;
      if (!A) {
        PC = PC + argsToRel(args[0]);
      }
      break;
    case 0x12: // LCALL addr16
      nextPC(opcode);
      loadNextPC = false;
      SP = SP + 1;
      InternalRAM[SP] = PCL;
      SP = SP + 1;
      InternalRAM[SP] = PCH;
      PC = argsToAddr16(args[0], args[1]);
      break;
    case 0x02: // LJMP addr16
      nextPC(opcode);
      loadNextPC = false;
      PC = argsToAddr16(args[0], args[1]);
      break;
    case 0x76: // MOV @R0, #data
    case 0x77: // MOV @R1, #data
      window[getAtRnName(opcode)] = argsToData(args[0]);
      break;
    case 0xF6: // MOV @R0, A
    case 0xF7: // MOV @R1, A
      window[getAtRnName(opcode)] = A;
      break;
    case 0xA6: // MOV @R0, iram
    case 0xA7: // MOV @R1, iram
      window[getAtRnName(opcode)] = InternalRAM[args[0]];
      break;
    case 0x74: // MOV A, #data
      A = argsToData(args[0]);
      break;
    case 0xE6: // MOV A, @R0
    case 0xE7: // MOV A, @R1
      A = getRnName(opcode);
      break;
    case 0xE8: // MOV A, R0
    case 0xE9: // MOV A, R1
    case 0xEA: // MOV A, R2
    case 0xEB: // MOV A, R3
    case 0xEC: // MOV A, R4
    case 0xED: // MOV A, R5
    case 0xEE: // MOV A, R6
    case 0xEF: // MOV A, R7
      A = getRn(opcode);
      break;
    case 0xE5: // MOV A, iram
      A = InternalRAM[args[0]];
      break;
    case 0xA2: // MOV C, bit
      C = argsToBit(args[0]);
      break;
    case 0x90: // MOV DPTR, #data16
      DPTR = argsToData16(args[0], args[1]);
      break;
    case 0x78: // MOV R0, #data
    case 0x79: // MOV R1, #data
    case 0x7A: // MOV R2, #data
    case 0x7B: // MOV R3, #data
    case 0x7C: // MOV R4, #data
    case 0x7D: // MOV R5, #data
    case 0x7E: // MOV R6, #data
    case 0x7F: // MOV R7, #data
      window[getRnName(opcode)] = argsToData(args[0]);
      break;
    case 0xF8: // MOV R0, A
    case 0xF9: // MOV R1, A
    case 0xFA: // MOV R2, A
    case 0xFB: // MOV R3, A
    case 0xFC: // MOV R4, A
    case 0xFD: // MOV R5, A
    case 0xFE: // MOV R6, A
    case 0xFF: // MOV R7, A
      window[getRnName(opcode)] = A;
      break;
    case 0xA8: // MOV R0, iram
    case 0xA9: // MOV R1, iram
    case 0xAA: // MOV R2, iram
    case 0xAB: // MOV R3, iram
    case 0xAC: // MOV R4, iram
    case 0xAD: // MOV R5, iram
    case 0xAE: // MOV R6, iram
    case 0xAF: // MOV R7, iram
      window[getRnName(opcode)] = InternalRAM[args[0]];
      break;
    case 0x92: // MOV bit, C
      setBit(args[0], C);
      break;
    case 0x75: // MOV iram, #data
      InternalRAM[args[0]] = argsToData(args[1]);
      updateOnSBUFWrite(args[0]);
      break;
    case 0x86: // MOV iram, @R0
    case 0x87: // MOV iram, @R1
      InternalRAM[args[0]] = getAtRn(opcode);
      updateOnSBUFWrite(args[0]);
      break;
    case 0x88: // MOV iram, R0
    case 0x89: // MOV iram, R1
    case 0x8A: // MOV iram, R2
    case 0x8B: // MOV iram, R3
    case 0x8C: // MOV iram, R4
    case 0x8D: // MOV iram, R5
    case 0x8E: // MOV iram, R6
    case 0x8F: // MOV iram, R7
      InternalRAM[args[0]] = getRn(opcode);
      updateOnSBUFWrite(args[0]);
      break;
    case 0xF5: // MOV iram, A
      InternalRAM[args[0]] = A;
      updateOnSBUFWrite(args[0]);
      break;
    case 0x85: // MOV iram, iram
      InternalRAM[args[1]] = InternalRAM[args[0]];
      updateOnSBUFWrite(args[1]);
      break;
    case 0x93: // MOVC A, @A + DPTR
      A = getMemLoc(A + DPTR);
      break;
    case 0x83: // MOVC A, @A + PC
      A = getMemLoc(A + PC);
      break;
    case 0xF0: // MOVX @DPTR, A
      setMemLoc(DPTR, A);
      break;
    case 0xF2: // MOVX @R0, A
    case 0xF3: // MOVX @R1, A
      setMemLoc(getAtRn(opcode), A);
      break;
    case 0xE0: // MOVX A, @DPTR
      A = getMemLoc(DPTR);
      break;
    case 0xE2: // MOVX A, @R0
    case 0xE3: // MOVX A, @R1
      A = getMemLoc(getAtRn(opcode));
      break;
    case 0xA4: // MUL AB
      tmp.product = A * B;
      C = 0;
      OV = (tmp.product > 255);
      A = tmp.product % 256;
      B = tmp.product >> 8;
      break;
    case 0x00: // NOP
      break;
    case 0x42: // ORL iram, A
      InternalRAM[args[0]] = argsToDirect(args[0]) | A;
      updateOnSBUFWrite(args[0]);
      break;
    case 0x43: // ORL iram, #data
      InternalRAM[args[0]] = argsToDirect(args[0]) | argsToData(args[1]);
      updateOnSBUFWrite(args[0]);
      break;
    case 0x44: // ORL A, #data
      A = A | argsToData(args[0]);
      break;
    case 0x45: // ORL A, iram
      A = A | argsToDirect(args[0]);
      break;
    case 0x46: // ORL A, @R0
    case 0x47: // ORL A, @R1
      A = A | getAtRn(opcode);
      break;
    case 0x48: // ORL A, R0
    case 0x49: // ORL A, R1
    case 0x4A: // ORL A, R2
    case 0x4B: // ORL A, R3
    case 0x4C: // ORL A, R4
    case 0x4D: // ORL A, R5
    case 0x4E: // ORL A, R6
    case 0x4F: // ORL A, R7
      A = A | getRn(opcode);
      break;
    case 0x72: // ORL C, bit
      C = C | argsToBit(args[0]);
      break;
    case 0xA0: // ORL C, !bit
      C = C | !argsToBit(args[0]);
      break;
    case 0xD0: // POP iram
      InternalRAM[args[0]] = InternalRAM[SP];
      updateOnSBUFWrite(args[0]);
      SP = SP - 1;
      break;
    case 0xC0: // PUSH iram
      SP = SP + 1;
      InternalRAM[SP] = InternalRAM[args[0]];
      break;
    case 0x22: // RET
    case 0x32: // RETI
      loadNextPC = false;
      PCH = InternalRAM[SP];
      SP = SP - 1;
      PCL = InternalRAM[SP];
      SP = SP - 1;
      break;
    case 0x23: // RL A
      tmp.A7 = (A >> 7) & 1;
      A = (A << 1) + tmp.A7;
      break;
    case 0x33: // RLC A
      tmp.A7 = (A >> 7) & 1;
      A = (A << 1) + C;
      C = tmp.A7;
      break;
    case 0x03: // RR A
      tmp.A0 = A & 1;
      A = (A >> 1) + (tmp.A0 << 7);
      break;
    case 0x13: // RRC A
      tmp.A0 = A & 1;
      A = (A >> 1) + (C << 7);
      C = tmp.A0;
      break;
    case 0xD3: // SETB C
      C = 1;
      break;
    case 0xD2: // SETB bit
      setBit(args[0], 1);
      break;
    case 0x80: // SJMP reladdr
      PC = PC + argsToRel(args[0]);
      break;
    case 0x94: // SUBB A, #data
      tmp.diff = A - argsToData(args[0]);
      AC = (argsToData(args[0]) % 16) > (A % 16);
      OV = (tmp.diff < -128) || (tmp.diff > 127);
      A = tmp.diff - C;
      C = tmp.diff < 0;
      break;
    case 0x95: // SUBB A, iram
      tmp.diff = A - argsToDirect(args[0]);
      AC = (argsToDirect(args[0]) % 16) > (A % 16);
      OV = (tmp.diff < -128) || (tmp.diff > 127);
      A = tmp.diff - C;
      C = tmp.diff < 0;
      break;
    case 0x96: // SUBB A, @Rn
    case 0x97:
      tmp.diff = A - getAtRn(opcode);
      AC = (getAtRn(opcode) % 16) > (A % 16);
      OV = (tmp.diff < -128) || (tmp.diff > 127);
      A = tmp.diff - C;
      C = tmp.diff < 0;
      break;
    case 0x98: // SUBB A, R0
    case 0x99: // SUBB A, R1
    case 0x9A: // SUBB A, R2
    case 0x9B: // SUBB A, R3
    case 0x9C: // SUBB A, R4
    case 0x9D: // SUBB A, R5
    case 0x9E: // SUBB A, R6
    case 0x9F: // SUBB A, R7
      tmp.diff = A - getRn(opcode);
      AC = (getRn(opcode) % 16) > (A % 16);
      OV = (tmp.diff < -128) || (tmp.diff > 127);
      A = tmp.diff - C;
      C = tmp.diff < 0;
      break;
    case 0xC4: // SWAP A
      tmp.AH = A >> 4;
      tmp.AL = A % 16;
      A = (tmp.AL << 4) + tmp.AH;
      break;
    case 0xA5: // Unknown.
      break;
    case 0xC6: // XCH A, @R0
    case 0xC7: // XCH A, @R1
      tmp.XCH = A;
      A = getAtRn(opcode);
      window[getAtRnName(opcode)] = tmp.XCH;
      break;
    case 0xC8: // XCH A, R0
    case 0xC9: // XCH A, R1
    case 0xCA: // XCH A, R2
    case 0xCB: // XCH A, R3
    case 0xCC: // XCH A, R4
    case 0xCD: // XCH A, R5
    case 0xCE: // XCH A, R6
    case 0xCF: // XCH A, R7
      tmp.XCH = A;
      A = getRn(opcode);
      window[getRnName(opcode)] = tmp.XCH;
      break;
    case 0xC5: // XCH A, iram
      tmp.XCH = A;
      A = InternalRAM[args[0]];
      InternalRAM[args[0]] = tmp.XCH;
      updateOnSBUFWrite(args[0]);
      break;
    case 0xD6: // XCHD A, @R0
    case 0xD7: // XCHD A, @R1
      tmp.AL = A % 16;
      tmp.AtRnL = getAtRn(opcode) % 16;
      A = A - tmp.AL + tmp.AtRnL;
      window[getAtRnName(opcode)] += tmp.AL - tmp.AtRnL;
      break;
    case 0x62: // XRL iram, A
      InternalRAM[args[0]] = argsToDirect(args[0]) ^ A;
      updateOnSBUFWrite(args[0]);
      break;
    case 0x63: // XRL iram, #data
      InternalRAM[args[0]] = argsToDirect(args[0]) ^ argsToData(args[1]);
      updateOnSBUFWrite(args[0]);
      break;
    case 0x64: // XRL A, #data
      A = A ^ argsToData(args[0]);
      break;
    case 0x65: // XRL A, iram
      A = A ^ argsToDirect(args[0]);
      break;
    case 0x66: // XRL A, @R0
    case 0x67: // XRL A, @R1
      A = A ^ getAtRn(opcode);
      break;
    case 0x68: // XRL A, R0
    case 0x69: // XRL A, R1
    case 0x6A: // XRL A, R2
    case 0x6B: // XRL A, R3
    case 0x6C: // XRL A, R4
    case 0x6D: // XRL A, R5
    case 0x6E: // XRL A, R6
    case 0x6F: // XRL A, R7
      A = A ^ getRn(opcode);
      break;
    default:
      break;
  }
  if (loadNextPC) {
    nextPC(opcode);
  }
  updateState();
  if (runState) {
    runState = setTimeout(stepInstruction, 1000 / runSpeed);
    if (verbose && (runState % 200 === 0)) {
      console.clear();
    }
  }
};

var runFromMemory = function () {
  runState = true;
  runstop.value = 'Stop from Memory';
  stepInstruction();
};

var stopFromMemory = function () {
  clearTimeout(runState);
  runState = false;
  runstop.value = 'Run from Memory';
};

var reset = function () {
  InternalRAM.clear();
  PC = 0x00;
  SP = 0x07;
  P0 = 0xFF;
  P1 = 0xFF;
  P2 = 0xFF;
  P3 = 0xFF;
  updateState();
};

reset();
resetButton.onclick = reset;

runstop.onclick = function () {
  if (runState) {
    stopFromMemory();
  } else {
    runFromMemory();
  }
};

terminal.onkeypress = function (e) {
  if (e.which >= 32) {
    debugger;
    terminal.keydown = true;
    SBUF = e.which;
    terminal.keydown = false;
    RI = 1;
  }
  return false;
};

terminal.sndchr = function (n) {
  if (!TI && n !== 10) {
    terminal.value += String.fromCharCode(n);
  }
  TI = 1;
};

monrun.onclick = function () {
  monrun.value = (Mode ? 'MON' : 'RUN') + ' mode: click to change';
  addhex.value = 'Add Hex File to ' + (Mode ? 'ROM' : 'RAM');
  Mode = 1 - Mode;
  reset();
};
