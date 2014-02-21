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
<textarea id="hexfile" rows="20" cols="80">:108000007590807480797F7A7F03F59020E00280FC
:09801000F823F59020E7F280F856
:00000001FF</textarea><br>
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
