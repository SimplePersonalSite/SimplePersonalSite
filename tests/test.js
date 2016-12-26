var assert = chai.assert;
describe('Util', function() {
  describe('createSingleton', function() {
    it('set the function name', function() {
      assert.strictEqual(Util.createSingleton('asdf').name, 'asdf');
      assert.strictEqual(Util.createSingleton('zZz').name, 'zZz');
    });
    it('error if instantiated directly', function() {
      var S = Util.createSingleton('zap');
      try {
        new S();
        assert.fail('expected direct instantiation error');
      } catch (e) {
        assert.strictEqual(e.message,
            'zap is a singleton. Call getInstance() to retrieve instance.');
      }
    });
    it('no error if getInstance()', function() {
      Util.createSingleton('rawr').getInstance();
    });
    it('getInstance() returns instance of class', function() {
      var Class = Util.createSingleton('rawr');
      assert.instanceOf(Class.getInstance(), Class);
    });
    it('getInstance() returns the exact same instance', function() {
      var Class = Util.createSingleton('rawr');
      assert.strictEqual(Class.getInstance(), Class.getInstance());
    });
    it('sperate calls create different classes', function() {
      var Class1 = Util.createSingleton('rawr');
      var Class2 = Util.createSingleton('rawr');
      assert.notEqual(Class1, Class2);
      assert.notInstanceOf(Class1.getInstance(), Class2);
      assert.notInstanceOf(Class2.getInstance(), Class1);
      assert.notEqual(Class1.getInstance(), Class2.getInstance());
    });
    it('calls constructor if present', function() {
      var z = {};
      var Class = Util.createSingleton('asdf', function() {this.taco = z;});
      assert.strictEqual(Class.getInstance().taco, z);
    });
  });
});
