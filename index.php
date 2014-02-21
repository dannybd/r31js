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
	<title>8051JS: An emulator</title>
	<link rel="stylesheet" type="text/css" href="style.css<?= $nocache ?>">
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
<textarea id="hexfile" rows="20" cols="80"><?
$MINMON = <<<EOD
:03000000020100FA
:03000300020100F7
:03000B00020100EF
:03001300020100E7
:03001B00020100DF
:03002300020100D7
:03002B00020100CF
:10010000C2AF12013F1202870A0D57656C636F6D13
:100110006520746F20362E313135210A0D4D494E40
:100120004D4F4E3E200075812FC2AFC20012028794
:100130000D0A2A00C29812024AFA02026680E77586
:100140008920758841758DFD75985022020A020A32
:10015000020A020A0198020A020A0182020A020A3B
:10016000020A020A020A020A020A020A020A020A2F
:1001700001EA020A020A020A020A020A020A020A40
:10018000020A120238FF1202A6120238C0E012025E
:10019000A612029BEFC0E02212029B743E1202756F
:1001A00012027DB43AFA1201E06021F81201E0D2A5
:1001B000E7F5831201E0F5821201E01201E0F0A3FD
:1001C000D8F91201E0742E12027580D41201E012E7
:1001D00001E01201E01201E0742E12027502013DED
:1001E0001202382000012202022012029B743E12E9
:1001F00002751202381202A6F5831202381202A604
:10020000F58212029BE01202A6221202870D0A203A
:1002100062616420636F6D6D616E64200002013D58
:100220001202870D0A2062616420706172616D653F
:10023000746572200002013D12027D1202CDC4F5E8
:10024000F012027D1202CD45F02212027DC2E512AB
:100250000275C394405003120220C0E0941B400377
:10026000120220D0E02290014CEA230493C0E0EA7D
:100270002393C0E022C299F5993099FD223098FD70
:10028000E599547FC29822D083D082E493B40002CF
:100290008006120275A380F3740173740A1202754A
:1002A000740D12027522C0E01202B5120275EA1234
:1002B0000275D0E022FA540F24F650022407243AA3
:1002C000CAC4540F24F650022407243A22C2002440
:1002D000D05017C324F64003240A22C2E5C324F9F0
:1002E0005008C324FA4003540F22D20002013D02F9
:0202F00000000C
:00000001FF
EOD;

$PHASER = <<<EOD
:108000007590807480797F7A7F03F59020E00280FC
:09801000F823F59020E7F280F856
:00000001FF
EOD;

if (isset($_GET['minmon'])) {
  echo $MINMON;
} else {
  echo $PHASER;
}
?></textarea><br>
<input type="button" id="addhex" value="Add Hex File to Memory" />
<input type="button" id="runstop" value="Run from Memory" />
<input type="button" id="monrun" value="MON mode: click to change" />
<div class="lightBank P1">
<span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span>
</div>
<script src="http://fb.me/react-0.8.0.min.js"></script>
<script src="http://fb.me/JSXTransformer-0.8.0.js"></script>
<script type="text/jsx" src="code.js"></script>
</body>
</html>
