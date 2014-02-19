/** @jsx React.DOM */

var hexfile = document.getElementById('hexfile');
var addhex  = document.getElementById('addhex');

Uint8Array.prototype.clear = function() { this.set(Array(this.length)); }

var ProgramMemory = new Uint8Array(64000); // EPROM. 64K bytes
var DataMemory    = new Uint8Array(64000); // RAM, 64K bytes
var IntMemory = new Uint8Array(0x100);
var Stack = new Uint8Array(0x1000);

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
  }
};

var defineBit = function (varName, byteName, bit) {
  Object.defineProperty(window, varName, bitProps(byteName, bit));
};

var bitAddressable = function (varName) {
  var varName_ = varName + '_';
  window[varName_] = {};
  var i;
  for (i = 0; i < 8; i++) {
    Object.defineProperty(window[varName_], i, bitProps(varName, i));
  }
};

var defineAddressableByte = function (varName, memorySpace, addr) {
  defineByte(varName, memorySpace, addr);
  bitAddressable(varName);
};

var defineRegister = function (i) {
  Object.defineProperty(window, 'R' + i, {
    get: function () { return IntMemory[RS1 * 16 + RS0 * 8 + i]; },
    set: function (val) { IntMemory[RS1 * 16 + RS0 * 8 + i] = val; }
  });
};

[0,1,2,3,4,5,6,7].forEach(defineRegister);

// Ordered by page 2-8 of the 8051 PDF
defineAddressableByte('ACC', IntMemory, 0xE0);
defineAddressableByte('A', IntMemory, 0xE0);
defineAddressableByte('B', IntMemory, 0xF0);
defineAddressableByte('PSW', IntMemory, 0xD0);
defineByte('SP', IntMemory, 0x81);
defineByte('DPL', IntMemory, 0x82);
defineByte('DPH', IntMemory, 0x83);
Object.defineProperty(window, 'DPTR', {
  get: function () { return (DPH << 8) + DPL; },
  set: function (val) { 
    DPH = val >> 8;
    DPL = val % 0x100;
  }
});
defineAddressableByte('P0', IntMemory, 0x80);
defineAddressableByte('P1', IntMemory, 0x90);
defineAddressableByte('P2', IntMemory, 0xA0);
defineAddressableByte('P3', IntMemory, 0xB0);
defineAddressableByte('IP', IntMemory, 0xB8);
defineAddressableByte('IE', IntMemory, 0xA8);
defineByte('TMOD', IntMemory, 0x89);
defineAddressableByte('TCON', IntMemory, 0x88);
defineByte('TH0', IntMemory, 0x8C);
defineByte('TL0', IntMemory, 0x8A);
defineByte('TH1', IntMemory, 0x8D);
defineByte('TL1', IntMemory, 0x8B);
defineAddressableByte('SCON', IntMemory, 0x98);
defineByte('SBUF', IntMemory, 0x99);
defineAddressableByte('PCON', IntMemory, 0x87);

// Where do I actually put these?
defineByte('PCL', IntMemory, 0xFE);
defineByte('PCH', IntMemory, 0xFF);
Object.defineProperty(window, 'PC', {
  get: function () { return (PCH << 8) + PCL; },
  set: function (val) { 
    PCH = val >> 8;
    PCL = val % 0x100;
  }
});

// Source: Page 2-9
SP = 0x07;
P0 = 0xFF;
P1 = 0xFF;
P2 = 0xFF;
P3 = 0xFF;

defineBit('C',    'PSW',  7);
defineBit('CY',   'PSW',  7);
defineBit('AC',   'PSW',  6);
defineBit('F0',   'PSW',  5);
defineBit('RS1',  'PSW',  4);
defineBit('RS0',  'PSW',  3);
defineBit('OV',   'PSW',  2); // TODO
defineBit('P',    'PSW',  0); // TODO

defineBit('SMOD', 'PCON', 7);
defineBit('GF1',  'PCON', 3);
defineBit('GF0',  'PCON', 2);
defineBit('PD',   'PCON', 1);
defineBit('IDL',  'PCON', 0);

defineBit('EA',   'IE',   7);
defineBit('ET2',  'IE',   5);
defineBit('ES',   'IE',   4);
defineBit('ET1',  'IE',   3);
defineBit('EX1',  'IE',   2);
defineBit('ET0',  'IE',   1);
defineBit('EX0',  'IE',   0);

defineBit('PT2',  'IP',   5);
defineBit('PS',   'IP',   4);
defineBit('PT1',  'IP',   3);
defineBit('PX1',  'IP',   2);
defineBit('PT0',  'IP',   1);
defineBit('PX0',  'IP',   0);

defineBit('TF1',  'TCON', 7);
defineBit('TR1',  'TCON', 6);
defineBit('TF0',  'TCON', 5);
defineBit('TR0',  'TCON', 4);
defineBit('IE1',  'TCON', 3);
defineBit('IT1',  'TCON', 2);
defineBit('IE0',  'TCON', 1);
defineBit('IT0',  'TCON', 0);

defineBit('SM0',  'SCON', 7);
defineBit('SM1',  'SCON', 6);
defineBit('SM2',  'SCON', 5);
defineBit('REN',  'SCON', 4);
defineBit('TB8',  'SCON', 3);
defineBit('RB8',  'SCON', 2);
defineBit('TI',   'SCON', 1);
defineBit('RI',   'SCON', 0);

var opcodeArgTypes = {
  'Rn': 0,        // R7 - R0
  'direct': 0,    // 8-bit internal data location's address. This could be Internal Data RAM [0-127] or a SFR [128-255].
  '@Ri': 0,       // 8-bit internal data RAM location (0-255) addressed indirectly through register R1 or R0.
  '#data': 0,     // 8-bit constant included in instruction
  '#data 16': 0,  // 16-bit constant included in instruction
  'addr 16': 0,   // 16-bit destination address. Used by LCALL & LJMP. A branch can be anywhere within the 64K-byte Program Memory Address Space.
  'addr 11': 0,   // 11-bit destination address. Used by ACALL & AJMP. The branch will be within the same 2K-byte page of program memory as the first byte of the following instruction.
  'rel': 0,       // Signed (two's complement) 8-bit offset byte. Used by SJMP and all conditional jumps. Range is -128 to +127 bytes relative to the first byte of the following instruction.
  'bit': 0,       // Direct Addressed bit in Internal Data RAM or SFR.
};

/*****
 * TODO:
 * - Understand memory layout.
 * - Write register bank system.
 * - Have parity bit perform automatically
 * - Write interpretation methods
 * - Figure out @ Ri.
 */

var LightBank = React.createClass({
  render: function () {
    var byte = this.props.byte;
    var lightBulbs = [7, 6, 5, 4, 3, 2, 1, 0].map(function (i) {
      var bit = byte[i];
      return (<span className={bit ? "on" : "off"}>{bit}</span>);
    });
    return (
      <div className="lightBank">
        {lightBulbs}
      </div>
    );
  }
});

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
    1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0xF_
];

var readOpcodeAndArgs = function () {
  var op = Memory[PC];
  var args = [];
  var i;
  for (i = 1; i < opcodeByteCounts[op]; i++) {
    args.push(Memory[PC + i]);
  }
  return [op, args];
};

var strToHex = function(n) {
  return parseInt(n, 16);
};

var intToHexStr = function(n) {
  return n.toString(16).toUpperCase();
};

var printMemoryHead = function () {
  var str = '';
  str += '\nMemory head:\n';
  str += '\t |\t0\t1\t2\t3\t4\t5\t6\t7\t8\t9\tA\tB\tC\tD\tE\tF\n';
  str += '-----------------------------------';
  str += '-----------------------------------\n'; 
  str += [].slice
            .apply(Memory.subarray(0,0xFF))
            .map(intToHexStr).join('\t').match(/(\w+\t){16}/g)
            .map(function (x, i) { 
              return '0x' + intToHexStr(i) + '_ |\t' + x; 
            }).join('\n');
  str += '\n';
  console.log(str);
};

var fillMemoryFromHex = function () {
  Memory.clear();
  if (!hexfile.value) {
    return;
  }
  var hexLines = hexfile.value.substr(1).split('\n:');
  hexLines.forEach(function (line, lineNum) {
    console.log('Running on line ' + lineNum);
    var bytes = line.match(/../g);
    if (bytes.map(strToHex).reduce(function(a, b) { return a + b; }) % 256) {
      // Failed the checksum
      console.log('Checksum failed on line ' + lineNum + '!');
      // return;
    }
    var recordLength = strToHex(bytes[0]);
    var loadAddress = strToHex(bytes[1] + bytes[2]);
    var recordType = strToHex(bytes[3]);
    if (recordType === 1) {
      console.log('End record type detected!');
      return;
    }
    PC = loadAddress;
    var i;
    for (i = 4; i < 4 + recordLength; i++) {
      Memory[PC] = strToHex(bytes[i]);
      PC = PC + 1;
    }
  });
  printMemoryHead();
  PC = 0;
};
addhex.onclick = fillMemoryFromHex;


var RUN_SPEED = 250; // in ms
var runState = false;

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

var PCToNextOpcode = function (opcode) {
  PC = PC + opcodeByteCounts[opcode];
};

var stepInstruction = function () {
  var nextOpAndArgs = readOpcodeAndArgs();
  var opcode = nextOpAndArgs[0];
  var args   = nextOpAndArgs[1];
  console.log(
    'PC is at byte 0x' + intToHexStr(PC) + ': opcode ' + intToHexStr(opcode) + 
    ' [' + args.map(intToHexStr).join(', ') + ']'
  );
  switch (opcode) {
    case 0x00: // NOP
    default:
      PCToNextOpcode(opcode);
      break;
    case 0x74: // MOV A, #data
      A = args[0];
      PCToNextOpcode(opcode);
      break;
    case 0x85: // MOV iram, iram
      IntMemory[args[1]] = IntMemory[args[0]];
      PCToNextOpcode(opcode);
      break;
    case 0xD2: // SETB bit addr
      P1_[2] = 1;
      PCToNextOpcode(opcode);
      break;
    case 0x80: // SJMP reladdr
      PCToNextOpcode(opcode);
      var tmp = new Int8Array(1);
      tmp[0] += args[0];
      PC = PC + tmp[0];
      break;
  }
  if (runState) {
    runState = setTimeout(stepInstruction, RUN_SPEED);
  }
};

runstop.onclick = function () {
  runState ? stopFromMemory() : runFromMemory();
}