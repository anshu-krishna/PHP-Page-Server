<header style="padding:0.5em;outline:auto">
	This is page Header;
	<?=
		isset($_QUERY['a'])
		? '[[ `./navbar2.html` ]]'
		: '[[ `./navbar1.html` ]]'
	?>
</header>