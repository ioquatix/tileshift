
/// *** class Monster ***
/// This logic controls a layer with monsters on it.
function Monster(identity) {
	Widget.call(this, 5.0, identity);
	
	this.iterations = 10;
}

Monster.prototype = new Widget();
Monster.prototype.constructor = Monster;

Monster.BUG = 'Monster.BUG';

Monster.update = function(gameState) {
	var dead = false;
	
	var monsters = gameState.map.layers.monsters,
		playerLocation = gameState.playerLocation;
	
	for (var key in monsters) {
		if (randomInt(20) < 19) continue;
		
		if (!monsters.hasOwnProperty(key)) continue;
		
		var location = convertLocationKey(key);
		
		var delegate = new TileMapSearch(gameState.map, [playerLocation]),
			search = new PathFinder(delegate);

		delegate.distanceFunction = Vec2.euclidianDistance;

		delegate.prime(search, location);
		search.update(10);
		
		var path = search.currentPath(),
			next = location;
		
		if (path[1]) {
			next = path[1].step;
			monsters.move(location, next);
		}
		
		if (Vec2.equals(playerLocation, next)) {
			dead = true;
		}
	}
	
	return dead;
}

Monster.randomPlacement = function(generator, map) {
	if (randomInt(10) < 5) return;
	
	var r = randomInt(map.size[0]), c = randomInt(map.size[1]),
		tile = map.get([r, c]);

	if (tile && !tile.blocked()) {
		map.layers.monsters.set([r, c], new Monster(Monster.BUG));
	}
}
