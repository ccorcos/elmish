var translate = require('../src/translate.coffee');

var gh = {
	$github: function() {
		return {
			$fetch: {
				name: 'github',
				args: ["https://api.github.com/users/ccorcos/following", {
					method: 'get'
				}]
			}
		}
	}
}

//gh = {$github: require('../src/github.coffee')};

describe('translate', function() {
	describe('translate', function() {
		it('is "curried"', function() {
			(typeof translate(gh)).should.equal('function');
		});

		it('returns a stream', function() {
			flyd.isStream(translate(gh)(flyd.stream())).should.be.true;
		});

		it('returns with type: "fetch" and tree', function (done){
			var middleware = translate(gh);
			var input = flyd.stream();
			var output = middleware(input);

			flyd.on(function (x){
				R.path(['tree', 'custom', '$fetch', 'name'], x).should.equal('github');
				R.prop('type', x).should.equal('fetch');
				input.end();
				done();
			}, output);

			input({custom: {$github: true}});
		});
	});
});