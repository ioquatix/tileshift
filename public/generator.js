
/// *** class Generator ***
/// This is the core of the genetic algorithm, including mutation and fitness functions.
function Generator (map, goals, events, iterations) {
	this.map = map;
	this.goals = goals;
	this.events = events;
	this.currentPosition = events[events.length - 1][1];
	
	this.iterations = iterations;
	this.mutations = [];
}

Generator.prototype.mutate = function () {
	var map = this.map.duplicate();
	
	for (var index in this.mutations) {
		this.mutations[index](this, map);
	}
	
	return map;
}

Generator.prototype.score = function (map, goals) {
	var delegate = new TileMapSearch(map, goals);
	var search = new PathFinder(delegate), worst = (map.size[0] + map.size[1]) / 8;
	
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
	// Try to optimise for one goal:
	var j = randomInt(this.goals.length),
		goals = [this.goals[j]];
	
	var candidates = new BinaryHeap(function(candidate){
		return candidate[0].cost();
	});
	
	candidates.push([this.score(this.map, goals), this.map])
	
	for (var i = 0; i < iterations; i += 1) {
		var permutation = this.mutate();
		candidates.push([this.score(permutation, goals), permutation])
	}
	
	return candidates.pop()[1];
}
