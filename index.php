<?php
//if(isset($_GET['dev'])) $_POST = $_POST + $_GET; //REMOVE AFTER DEVELOPMENT

/*
header('Content-type: text/javascript');
/*/
header('Content-type: text/html; charset=utf-8');
//*/
$nocache = "";
//$nocache = "?nocache=".time();
?>
<!DOCTYPE html>
<!--[if IE 7]><html lang="en-us" class="ie ie7 lte9 lte8"><![endif]-->
<!--[if IE 8]><html lang="en-us" class="ie ie8 lte9 lte8"><![endif]-->
<!--[if IE 9]><html lang="en-us" class="ie ie9 lte9"><![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--><html lang="en-us"><!--<![endif]-->
<head>
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<title>Compile to machine code</title>
	<!-- link rel="stylesheet" type="text/css" href="style.css<?= $nocache ?>" -->
	<!-- script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
	<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js"></script -->
	<script>
		var _gaq=[["_setAccount","UA_XXXXXXXX_X"],["_trackPageview",location.pathname+location.search+location.hash]];
		(function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];g.async=1;
		g.src=("https:"==document.location.protocol?"https://ssl":"http://www")+".google-analytics.com/ga.js";
		s.parentNode.insertBefore(g,s)}(document,"script"));
	</script>
</head>
<body>
<textarea id="hexfile" rows="20" cols="80">:10000000740085E090D29280F7362E31313520523F
:050010006F636B73211A
:00000001FF</textarea><br>
<input type="button" id="addhex" value="Add Hex File to Memory" />
<input type="button" id="runstop" value="Run from Memory" />
<script>
  var hexfile = document.getElementById('hexfile');
  var addhex = document.getElementById('addhex');
  
  var memory = new Uint8Array(8000);
  memory.clear = function () {
    var i;
    for (i = 0; i < memory.length; i++) {
      memory[i] = 0;
    }
  };
  var stack = new Uint8Array(256);
  
  var Byte = function (initialValue) {
    var newByte = new Uint8Array(1);
    newByte[0] = initialValue || 0;
    return newByte;
  };
  // Define the registers. All of them. (Call a register by writing A[0].
  // It's clunky but necessary.
  var A  = Byte();
  var R0 = Byte();
  var R1 = Byte();
  var R2 = Byte();
  var R3 = Byte();
  var R4 = Byte();
  var R5 = Byte();
  var R6 = Byte();
  var R7 = Byte();
  var Rs = [R0, R1, R2, R3, R4, R5, R6, R7];
  var B  = Byte();
  var dph = Byte();
  var dpl = Byte();
  // dptr?
  var PC = Byte();
  var SP = Byte();
  var Carry = false;
  var Overflow = false;
  
  var P1 = Byte();
  
  
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
    var op = memory[PC[0]];
    var args = [];
    var i;
    for (i = 1; i < opcodeByteCounts[op]; i++) {
      args.push(memory[PC[0] + i]);
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
              .apply(memory.subarray(0,0xFF))
              .map(intToHexStr).join('\t').match(/(\w+\t){16}/g)
              .map(function (x, i) { 
                return '0x' + intToHexStr(i) + '_ |\t' + x; 
              }).join('\n');
    str += '\n';
    console.log(str);
  };
  
  var fillMemoryFromHex = function () {
    memory.clear();
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
      PC[0] = loadAddress;
      var i;
      for (i = 4; i < 4 + recordLength; i++) {
        memory[PC[0]] = strToHex(bytes[i]);
        PC[0] = PC[0] + 1;
      }
    });
    printMemoryHead();
    PC[0] = 0;
  };
  addhex.onclick = fillMemoryFromHex;
  
  
  var RUN_SPEED = 25; // in ms
  var runState = false;
  
  var runFromMemory = function () {
    runState = true;
    runstop.value = 'Stop from Memory';
    stepInstruction();
  };
  
  var stopFromMemory = function () {
    runState = false;
    runstop.value = 'Run from Memory';
  };
  
  var PCToNextOpcode = function (opcode) {
    PC[0] = PC[0] + opcodeByteCounts[opcode];
  };
  
  var stepInstruction = function () {
    var nextOpAndArgs = readOpcodeAndArgs();
    var opcode = nextOpAndArgs[0];
    var opcodeArgs = nextOpAndArgs[1];
    console.log(
      'PC is at byte 0x' + intToHexStr(PC[0]) + ': opcode ' + opcode + 
      ' [' + opcodeArgs.join(', ') + ']'
    );
    switch (opcode) {
      case 0x00: // NOP
      default:
        PCToNextOpcode(opcode);
        break;
      case 0x74: // MOV A, #data
        A[0] = opcodeArgs[0];
        PCToNextOpcode(opcode);
        break;
      case 0x85:
        break;
    }
    if (runState) {
      setTimeout(stepInstruction, RUN_SPEED);
    }
  };
  
  runstop.onclick = function () {
    runState ? stopFromMemory() : runFromMemory();
  }
</script>
</body>
</html>
