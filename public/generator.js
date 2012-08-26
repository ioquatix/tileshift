
/// *** class Generator ***
/// This is the core of the genetic algorithm, including mutation and fitness functions.
function Generator (map, events, iterations) {
	this.map = map;
	this.events = events;
	this.currentPosition = events[events.length - 1][1];
	
	this.iterations = iterations;
}

Generator.prototype.mutate = function () {
	var map = this.map.duplicate();
	
	for (var i = 0; i < 4; i++) {
		var r = randomInt(11) - 5, c = randomInt(11) - 5;
		
		r += this.currentPosition[0];
		c += this.currentPosition[1];

		if (r < 1) r = 1;
		if (c < 1) c = 1;
		if (r > map.size[0]-1) r = map.size[0]-2;
		if (c > map.size[1]-1) c = map.size[1]-2;

		if (map.get([r, c]) == null) {
			map.set([r, c], new Tile(0, Platform.FLOOR));
		}
	}
	
	return [this.score(map), map]
}

Generator.prototype.score = function (map) {
	var goals = map.getSpecials(Tile.END);
	
	var delegate = new TileMapSearch(map, [goals[0][0]]);
	var search = new PathFinder(delegate), worst = (map.size[0] + map.size[1]) / 16;
	
	delegate.prime(search, this.currentPosition);
	
	if (this.iterations)
		search.update(this.iterations);
	else
		search.update(worst);
	
	// Save first search for debugging purposes:
	if (!this.search) {
		this.search = search;
	}
	
	var best = search.currentBest();
	//console.log('candidate', best.cost(), goals[0][0], best.costFromStart, best.costToGoal, best.step, search);
	return best;
}

Generator.prototype.evolve = function (iterations) {
	var candidates = new BinaryHeap(function(candidate){
		return candidate[0].cost();
	});
	
	candidates.push([this.score(this.map), this.map])
	
	for (var i = 0; i < iterations; i += 1) {
		var permutation = this.mutate();
		candidates.push(permutation);
	}
	
	var best = candidates.pop();
	
	//console.log('selected', best[0].step, best[0], best[1]);
	
	return best[1];
}
