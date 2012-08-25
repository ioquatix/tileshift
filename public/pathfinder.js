// Copyright (C) 2010 Samuel Williams. All Rights Reserved.

function PathFinder (delegate) {
	this.delegate = delegate;
	
	this.open = new BinaryHeap(function(node) {
		return node.cost();
	});
	
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
		this.constructForwardPath(node, path);
	
	path.push(node);
}

PathFinder.prototype.currentPath = function () {
	var path = new Array();
	
	if (this.open.top() != null)
		constructForwardPath(this.open.top(), path);
	
	return path;
}

PathFinder.CLOSED = 'closed';

PathFinder.prototype.addStep = function (parent, location, cost, estimateToGoal) {
	if (this.state[location] == PathFinder.CLOSED) {
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
			if (this.delegate.isGoalState(top)) return true;
			
			this.open.pop();
			this.delegate.addStepsFrom(this, top);
		}
		
		this.state[top.step] = PathFinder.CLOSED;
		
		iterations -= 1;
	}
	
	return this.open.size() == 0;
}
