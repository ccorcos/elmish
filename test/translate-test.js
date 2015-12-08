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

		it('translates object as expected', function (){
			var middleware = translate(gh);
			var output = middleware({custom: {$github: true}});

			R.path(['custom', '$fetch', 'name'], output).should.equal('github');
		});
	});
});