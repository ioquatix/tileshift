// Copyright (C) 2010 Samuel Williams. All Rights Reserved.

function PathFinder (delegate) {
	this.delegate = delegate;
	
	this.open = new BinaryHeap(function(node) {
		return node.cost();
	});
	
	this.best = null;
	
	this.state = {};
}

PathFinder.Node = function (step, costFromStart, costToGoal, parent) {
	this.step = step;
	this.costFromStart = costFromStart;
	this.costToGoal = costToGoal;
	this.parent = parent;
	
	// Deferred heap removal optimisation
	this.closed = false;
}

PathFinder.Node.prototype.cost = function () {
	return this.costFromStart + this.costToGoal;
}

PathFinder.prototype.constructForwardPath = function (node, path) {
	if (node.parent != null)
		this.constructForwardPath(node.parent, path);
	
	path.push(node);
}

PathFinder.prototype.currentPath = function () {
	var path = [];
	
	if (this.best)
		this.constructForwardPath(this.best, path);
	
	return path;
}

PathFinder.prototype.addStep = function (parent, location, cost, estimateToGoal) {
	// console.log('addStep', parent, location, cost, estimateToGoal);
	if (this.state[location] && this.state[location].closed) {
		return;
	}
	
	var costFromStart = (parent ? parent.costFromStart : 0) + cost;
	
	if (this.state[location]) {
		if (this.state[location].costFromStart > costFromStart)
			this.state[location].closed = true;
		else
			return;
	}
	
	var node = new PathFinder.Node(location, costFromStart, estimateToGoal, parent);
	this.state[location] = node;
	this.open.push(node)
}

PathFinder.prototype.update = function (iterations) {
	while (this.open.top() != null && iterations > 0) {
		var top = this.open.top();
		
		if (top.closed) {
			this.open.pop();
		} else {
			if (!this.best || this.best.costToGoal > top.costToGoal) this.best = top;
			
			if (this.delegate.isGoalState(top)) {
				return true;
			}
			
			this.open.pop();
			this.delegate.addStepsFrom(this, top);
		}
		
		this.state[top.step].closed = true;
		
		iterations -= 1;
	}
	
	return this.open.size() == 0;
}

PathFinder.prototype.currentBest = function () {
	return this.best;
}

function SearchRenderer (scale) {
	this.scale = scale;
	this.search = null;
}

SearchRenderer.prototype.display = function (context) {
	if (!this.search) return;
	
	context.font = "14px sans-serif";
	
	for (var loc in this.search.state) {
		loc = convertLocationKey(loc);
		
		if (this.search.state[loc] == this.search.currentBest()) {
			context.fillStyle = "#0000FF";
		} else if (this.search.state[loc].closed) {
			context.fillStyle = "#FF0000";
		} else {
			context.fillStyle = "#00FF00";
		}

		var costText = this.search.state[loc].cost().toFixed(1);
		
		context.textAlign = "center";
		
		context.strokeStyle = "#000000";
		context.strokeText(costText, (0.5+loc[1])*this.scale[1], (loc[0] + 1)*this.scale[0]);
		
		context.fillText(costText, (0.5+loc[1])*this.scale[1], (loc[0] + 1)*this.scale[0]);
	}
	
	var top = this.search.currentBest();
	
	context.strokeStyle = "#0000EE";
	context.beginPath();

	if (top) {
		context.moveTo(this.scale[1] * (0.5 + top.step[1]), this.scale[0] * (1 + top.step[0]))
	}

	while (top != null) {
		context.lineTo(this.scale[1] * (0.5 + top.step[1]), this.scale[0] * (1 + top.step[0]))
		top = top.parent;
	}
	
	context.stroke();
}