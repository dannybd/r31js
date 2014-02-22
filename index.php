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
	<title>R31JS: An emulator</title>
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
<textarea id="hexfile" rows="20" cols="44"><?
$MINMON = <<<EOD
:03000000020100FA
:03000300020100F7
:03000B00020100EF
:03001300020100E7
:03001B00020100DF
:03002300020100D7
:03002B00020100CF
:10010000C2AF1201521202BE0A0D57656C636F6DC9
:100110006520746F20362E313135210A0D4D494E40
:100120004D4F4E3E200075812FC2AFC2001202BE5D
:0D0130000D0A2A00C298120281FA02029DF7
:1001500080D4758920758841758DFD75985022026F
:100160002902290229022901AB022902290195024B
:100170002902290229022902290229022902290227
:1001800029022901FD02290229022902290211025C
:100190002902290229120257FF1202DD120257C05A
:1001A000E01202DD1202D2EFC0E0221202D2743E4F
:1001B0001202AC1202B4B43AFA1201F36021F8123E
:1001C00001F3D2E7F5831201F3F5821201F3120174
:1001D000F3F0A3D8F91201F3742E1202AC80D412FA
:1001E00001F31201F31201F31201F3742E1202ACA7
:1001F0000201501202572000012202023F1202693E
:10020000F583120269F5821202D2E01202DD0201C8
:1002100050120269F583120269F582E01202B412EB
:1002200002AC120269F00201501202BE0D0A2062F5
:10023000616420636F6D6D616E6420000201501275
:1002400002BE0D0A2062616420706172616D657486
:10025000657220000201501202B4120304C4F5F0CA
:100260001202B412030445F0221202B41202AC12BC
:100270000304C4F5F01202B41202AC12030445F0F8
:10028000221202B4C2E51202ACC39440500312021F
:100290003FC0E0941B400312023FD0E02290015F78
:1002A000EA230493C0E0EA2393C0E022C299F599BF
:1002B0003099FD223098FDE599547FC29822D08371
:1002C000D082E493B4000280061202ACA380F374DF
:1002D0000173740A1202AC740D1202AC22C0E01257
:1002E00002EC1202ACEA1202ACD0E022FA540F2463
:1002F000F650022407243ACAC4540F24F6500224AC
:1003000007243A22C20024D05017C324F640032405
:100310000A22C2E5C324F95008C324FA4003540F4B
:0903200022D2000201500200008B
:00000001FF
EOD;

$PHASER = <<<EOD
:100000007590807480797F7A7F03F59020E0028004
:09001000F823F59020E7F280F85E
:00000001FF
EOD;

$CALCULATOR = <<<EOD
:10000000758390758200E0A3F8E0A3F928F0A3E8D7
:1000100099F0A3E889F0A4F0A3E5F0F0A3E889F053
:0900200084F0A3E5F0F0020150A8
:00000001FF
EOD;

if (isset($_GET['minmon'])) {
  echo $MINMON;
} else if (isset($_GET['calculator'])) {
  echo $CALCULATOR;
} else {
  echo $PHASER;
}
?></textarea><textarea id="terminal" rows="20" cols="44"></textarea><br>
<input type="button" id="addhex" value="Add Hex File to ROM" />
<input type="button" id="runstop" value="Run from Memory" />
<input type="button" id="monrun" value="MON mode: click to change" />
<input type="button" id="resetButton" value="Reset" />
<div class="lightBank P1">
<span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span><span class="lightBulb off">0</span>
</div>
<br>
<p>
<h3>Code bits:</h3>
<h4>MINMON:</h4>
<pre><?= $MINMON; ?></pre>
<h4>Calculator:</h4>
<pre><?= $CALCULATOR; ?></pre>
<h4>Phaser:</h4>
<pre><?= $PHASER; ?></pre>
</p>
<script src="http://fb.me/react-0.8.0.min.js"></script>
<script src="http://fb.me/JSXTransformer-0.8.0.js"></script>
<script type="text/jsx" src="code.js"></script>
</body>
</html>
