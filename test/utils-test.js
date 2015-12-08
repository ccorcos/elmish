var {
	isObject,
	isArray,
	evolveLeavesWhere,
	leavesWhere,
	vennDiagram,
	liftAllObj
} = require('../src/utils.coffee');

describe('utils.coffee', function (){
	describe('isObject', function (){
		it('knows what an object is', function (){
			isObject({ima: 'object'}).should.equal(true);
			isObject('ima string').should.equal(false);
		});
	});

	describe('isArray', function (){
		it('knows what an array is', function (){
			isArray(['i', 'am', 'an', 'arra']).should.equal(true);
			isArray('ima string').should.equal(false);
		});
	});

	describe('evolveLeavesWhere', function (){
		var obj = {obj: {val: 0}, arr: [0,1,2], num: 0};
		it('is curried', function (){
			(typeof evolveLeavesWhere(R.T)).should.equal('function');
		});
		it('evolves leaves that according to fn', function (){
			var output = evolveLeavesWhere(R.is(Number), R.inc, obj);
			var expected = {obj: {val: 1}, arr: [1,2,3], num: 1};
			R.equals(output, expected).should.equal(true);
		});
	});

	describe('leavesWhere', function (){
		var obj = {obj: {val: 0}, arr: [0,1,2], num: 0};
		it('finds leaves by function', function (){
			var output = leavesWhere(R.is(Number), obj);
			var expected = [0,0,1,2,0];
			R.equals(output, expected).should.equal(true);
		});
	});

	describe('vennDiagram', function (){
		it('finds similarities and differences between arrays', function (){
			var output = vennDiagram([1,2,3], [3,4,5])
			var expected = [[1,2], [3], [4,5]];
			R.equals(output, expected).should.equal(true);
		});
	});

	describe('liftAllObj', function (done){
		it('lifts an object of streams', function (){
			function make(x, y, z){
				return {x, y, z};
			}
			var obj = make(flyd.stream(1), flyd.stream(2), flyd.stream(3))
			var expected = [make(1,2,3), make(10,2,3), make(10,20,3), make(10,20,30)];
			var count = 0;

			flyd.on(x => {
				R.equals(expected[count++], x).should.be.true, liftAllObj(obj);
				done();
			})

			obj.x(10);
			obj.y(20);
			obj.z(30);
		});
	});
});