const expect = require('chai').expect;

describe("sample test suite", function () {
  [...Array(10).keys()].forEach(i => {
    it(`Validate ${i} is not equal to 11`, function () {
      expect(i).to.not.equal(9);
    });
  });
});