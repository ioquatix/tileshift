//Generator support functions.
function checkCollision(map, p1, p2){
	var p1x = p1.x > 1 ? p1.x -1 : p1.x;
	var p1y = p1.y > 1 ? p1.y -1 : p1.y;
	var p2x = p2.x < map.size[0]-1 ? p2.x + 1 : p2.x;
	var p2y = p2.y < map.size[1]-1 ? p2.y + 1 : p2.y;

	for(i = p1x; i <= p2x; i++){
		for(j = p1y; j <= p2y; j++){
			if(map.get([i,j]) != null){
				return true;
			}
		}
	}
	return false;
}

function randomTileDelete(map) {
	var start;
	//Get random coords
	while(!start){
		var p1 = new Vec2(randomInt(map.size[0]),randomInt(map.size[1]));
		if(checkCollision(map, p1, p1)){
			start = p1;
		}
	}
	map.set([p1.x,p1.y], new Tile(-1, Platform.NONE));

 }
 
function placeRoom(map, p1, p2) {
	for(i = p1.x; i <= p2.x; i++){
		for(j = p1.y; j <= p2.y; j++){
			map.set([i,j], new Tile(0, Platform.FLOOR));
		}
	}
}

function goodDirections(map, point) {
	var dirs = [[1, 0],[-1, 0],[0, 1],[0, -1]];
	var gooddirs = [];
	if(point.x < map.size[0]/2) {
		gooddirs.push(dirs[0]);
	}else{
		gooddirs.push(dirs[1]);
	}
	if(point.y < map.size[1]/2) {
		gooddirs.push(dirs[2]);
	}else{
		gooddirs.push(dirs[3]);
	}
	
	return gooddirs;
}

//Generators.
//Generates a room.
function generateRoom(map) {
	var MIN = 2;
	var MAX = 7;
	var ATTEMPTS = 7000;
	var t = 0;
	
	//Get random coords
	while(t < ATTEMPTS){
		var p1 = new Vec2(randomIntRange(1, map.size[0]),randomIntRange(1, map.size[1]));
		var p2 = new Vec2(randomInt(map.size[0]), randomInt( map.size[1]));
		
		//check bounds
		if(p1.x < p2.x && p1.y < p2.y && p2.x - p1.x < MAX && p2.y - p1.y < MAX && p2.x - p1.x > MIN && p2.y - p1.y > MIN){
			if(!checkCollision(map, p1, p2)){
				break;
			}
		}
		t++;
	}
	if(t < ATTEMPTS){
		placeRoom(map, p1, p2);
		return p1;
	}
 }
 
 
function generateRoomAt(map, p1) {
	p1 = new Vec2(p1[0], p1[1]);
	var MIN = 2;
	var MAX = 7;
	var ATTEMPTS = 70000;
	var t = 0;
	
	//Get random coords
	while(t < ATTEMPTS){
		var p2 = new Vec2(randomInt(map.size[0]), randomInt( map.size[1]));
		
		//check bounds
		if(p1.x < p2.x && p1.y < p2.y && p2.x - p1.x < MAX && p2.y - p1.y < MAX && p2.x - p1.x > MIN && p2.y - p1.y > MIN){
			if(!checkCollision(map, p1, p2)){
				break;
			}
		}
		t++;
	}
	if(t < ATTEMPTS){
		placeRoom(map, p1, p2);
		return p1;
	}
}

//Generate a path of a room at a specific point.
function generatePath(map, p) {
	//Take point and find edge randomly.
	var dirs = goodDirections(map, p);
	var dir = dirs[randomInt(dirs.length)];
	var currentPt = [p.x+1, p.y+1];
	var onPlatform = true;
	//Walk to edge of platform
	while(onPlatform){
		currentPt[0] += dir[0];
		currentPt[1] += dir[1];
		if(map.get([currentPt[0],currentPt[1]]) == null){
			onPlatform = false;
		}
	}
	
	//Draw path until we hit something.
	while(!onPlatform){
		//Catch map bounds
		if(currentPt[0] >= map.size[0] || currentPt[1] >= map.size[1] || currentPt[0] < 0 || currentPt[1] < 0){
			onPlatform = true;
			break;
		}
		//Set tile
		map.set([currentPt[0], currentPt[1]], new Tile(0, Platform.FLOOR));
		//Move and check for hit.
		currentPt[0] += dir[0];
		currentPt[1] += dir[1];
		if(map.get([currentPt[0],currentPt[1]]) != null){
			onPlatform = true;
		}
	}
}

//All key/door code is below here.

//Places a given number of doors and keys on the map.
function generateMapDoorsKeys(map, numDoors){
	for(i = 0; i < numDoors; i++){
		var c = makeWaterColumn(map);
		var door = placeDoor(map, c),
			key = placeKey(map, door[0]);
		
		key.number = i;
		door.number = i;
		
		key.door = door[1];
		door[1].key = key;
		
		map.set(door[0], new Tile(0, Tile.BRIDGE));
	}
}

//Places a specified number of rooms on the map.
function generateRoomsOnMap(map, roomsList, numberOfRooms) {
	while(roomsList.length < numberOfRooms){
		var roompos = generateRoom(map);
		if(roompos != null){
			roomsList.push(roompos);
		}
	}
}


//Make a random column into water.
//Sticks between column 5 and Map.size-5.
//It returns the column in which
function makeWaterColumn(map){
	var c = 0;
	var isGoodColumn = false;
	
	while(!isGoodColumn){
		c = randomIntRange(5, map.size[1] - 5);
		for(r = 0; r < map.size[0]; r++){
			//check if column intersects the center of a platform.
			var tile = map.get([r,c]);
			var left = map.get([r,c-1]);
			var right = map.get([r,c+1]);
			if(tile && right && left && !tile.blocked() && !left.blocked() && !right.blocked()){
				isGoodColumn = true;
			}
		}
	}
	//If we want more than one door on a waterline, calculate that here.
	for(r = 0; r < map.size[0]; r++){
		var left = map.get([r,c-1]);
		var right = map.get([r,c+1]);
		if(left || right){
			map.set([r,c-1], new Tile(0, Platform.DIRT));
			map.set([r,c+1], new Tile(0, Platform.DIRT));
		}
		map.set([r,c], new Tile(-1, Platform.WATER));
	}
	return c;
}

//For a column in the map, places a door at a random valid row. Returns the position of door.
//A valid row is one which is on a platform, beside dirt and is at least one square away from
//the edge of the platform.
function placeDoor(map, c) {
	var dooroptions = [];
	
	for (r = 0; r < map.size[0]; r++) {
		var tile = map.get([r, c]);
		var upright = map.get([r - 1, c + 1]);
		var downleft = map.get([r + 1, c - 1]);
		var left = map.get([r, c - 1]);
		var right = map.get([r, c + 1]);
		if (tile && upright && downleft && left && right && !left.blocked() && !right.blocked()) {
			dooroptions.push([r,c]);
		}
	}
	
	//Pick one of these doors.
	var z = randomInt(dooroptions.length);
	var door = new DoorWidget();
	
	map.layers.doors[dooroptions[z]] = door;
	
	return [dooroptions[z], door];
}

function placeKey(map, door) {
	var p1  = new Vec2(randomIntRange(1, map.size[0]),randomIntRange(1, door[1] - 3));
	var tile = map.get([p1.x,p1.y]);
	while (!tile || tile.blocked()) {
		p1 = new Vec2(randomIntRange(1, door[0]),randomIntRange(1, door[1]));
		tile = map.get([p1.x,p1.y]);
	}
	
	var key = new KeyWidget();
	map.layers.keys[[p1.x,p1.y]] = key;
	
	return key;
}

//Returns a good position for a key and a door.
//Good position is defined as:
//The player cannot pass the door without using the key
//The player can access the key without passing through the door.
function generateKeyDoorPosition(map) {
	var keyRoom = rooms[randomInt(rooms.length)];
	
	return [[p1.x, p1.y], [, ]];
}

