<?php
$QUERY = &\KPS\Server::$_VALS['_REQ_']['query'];
?><header style="padding:0.5em;outline:auto">
	This is page Header;
	<?=
		isset($QUERY['a'])
		? '[[ "./navbar2.html" ]]'
		: '[[ "./navbar1.html" ]]'
	?>
</header>