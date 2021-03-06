/**
 * Author: Jeff Whelpley
 * Date: 4/3/15
 *
 *
 */
var name    = 'hrsoo.parser';
var taste   = require('taste');
var parser  = taste.target(name);

describe('UNIT ' + name, function () {
    describe('parseTimezone()', function () {
        it('should return default est if nothing set', function () {
            var state = {};
            var expected = { tokens: [], timezone: 'est' };
            var actual = parser.parseTimezone(state);
            actual.should.deep.equal(expected);
        });

        it('should return default est if nothing set', function () {
            var state = {
                tokens: [
                    { type: 'days', value: ['sunday'] },
                    { type: 'timezone', value: 'pst' }
                ]
            };
            var expected = { tokens: [{ type: 'days', value: ['sunday'] }], timezone: 'pst' };
            var actual = parser.parseTimezone(state);
            actual.should.deep.equal(expected);
        });
    });

    describe('parseAmPm()', function () {
        it('should do nothing if no ampm tokens', function () {
            var state = {};
            var expected = { tokens: [] };
            var actual = parser.parseAmPm(state);
            actual.should.deep.equal(expected);
        });

        it('should just remove ampm token if am', function () {
            var state = {
                tokens: [
                    { type: 'time', value: { hrs: 8, mins: 30 }},
                    { type: 'ampm', value: 'am' }
                ]
            };
            var expected = { tokens: [{ type: 'time', value: { hrs: 8, mins: 30 }, ampm: 'am' }] };
            var actual = parser.parseAmPm(state);
            actual.should.deep.equal(expected);
        });

        it('should add pm flag', function () {
            var state = {
                tokens: [
                    { type: 'time', value: { hrs: 8, mins: 30 }},
                    { type: 'ampm', value: 'pm' }
                ]
            };
            var expected = { tokens: [{ type: 'time', value: { hrs: 8, mins: 30 }, ampm: 'pm' }] };
            var actual = parser.parseAmPm(state);
            actual.should.deep.equal(expected);
        });
    });

    describe('doOperations() with throughOp()', function () {
        it('should remove through operation if at end', function () {
            var state = {
                noLog: true,
                tokens: [
                    { type: 'time', value: { hrs: 8, mins: 30 }},
                    { type: 'operation', value: 'through' }
                ]
            };
            var expected = { noLog: true, tokens: [{ type: 'time', value: { hrs: 8, mins: 30 } }] };
            var actual = parser.doOperations(state, 'through', parser.throughOp);
            actual.should.deep.equal(expected);
        });

        it('should remove through operation if at beginning', function () {
            var state = {
                noLog: true,
                tokens: [
                    { type: 'operation', value: 'through' },
                    { type: 'time', value: { hrs: 8, mins: 30 }}
                ]
            };
            var expected = { noLog: true, tokens: [{ type: 'time', value: { hrs: 8, mins: 30 } }] };
            var actual = parser.doOperations(state, 'through', parser.throughOp);
            actual.should.deep.equal(expected);
        });

        it('should get through times with no pm flag', function () {
            var state = {
                tokens: [
                    { type: 'time', value: { hrs: 8, mins: 30 }},
                    { type: 'operation', value: 'through' },
                    { type: 'time', value: { hrs: 5, mins: 0 }}
                ]
            };
            var expected = {
                tokens: [
                    { type: 'time', value: { ranges: [{
                        start: 830,
                        end: 1700
                    }]}}
                ]
            };
            var actual = parser.doOperations(state, 'through', parser.throughOp);
            actual.should.deep.equal(expected);
        });

        it('should get through times with am flag', function () {
            var state = {
                tokens: [
                    { type: 'time', value: { hrs: 4, mins: 30 }, ampm: 'am' },
                    { type: 'operation', value: 'through' },
                    { type: 'time', value: { hrs: 5, mins: 0 }, ampm: 'am' }
                ]
            };
            var expected = {
                tokens: [
                    { type: 'time', value: { ranges: [{
                        start: 430,
                        end: 500
                    }]}}
                ]
            };
            var actual = parser.doOperations(state, 'through', parser.throughOp);
            actual.should.deep.equal(expected);
        });

        it('should get through times with am flag', function () {
            var state = {
                tokens: [
                    { type: 'time', value: { hrs: 4, mins: 30 }, ampm: 'am' },
                    { type: 'operation', value: 'through' },
                    { type: 'time', value: { hrs: 5, mins: 0 }, ampm: 'pm' }
                ]
            };
            var expected = {
                tokens: [
                    { type: 'time', value: { ranges: [{
                        start: 430,
                        end: 1700
                    }]}}
                ]
            };
            var actual = parser.doOperations(state, 'through', parser.throughOp);
            actual.should.deep.equal(expected);
        });

        it('should get through days', function () {
            var state = {
                tokens: [
                    { type: 'days', value: ['monday'] },
                    { type: 'operation', value: 'through' },
                    { type: 'days', value: ['wednesday'] }
                ]
            };
            var expected = {
                tokens: [
                    { type: 'days', value: ['monday', 'tuesday', 'wednesday'] }
                ]
            };
            var actual = parser.doOperations(state, 'through', parser.throughOp);
            actual.should.deep.equal(expected);
        });
    });

    describe('compressDayTimes()', function () {
        it('should do nothing if less than 2 tokens', function () {
            var state = {};
            var expected = {};
            var actual = parser.compressDayTimes(state);
            actual.should.deep.equal(expected);
        });

        it('should compress days', function () {
            var state = {
                tokens: [
                    { type: 'days', value: ['monday'] },
                    { type: 'days', value: ['tuesday', 'friday'] }
                ]
            };
            var expected = {
                tokens: [
                    { type: 'days', value: ['monday', 'tuesday', 'friday'] }
                ]
            };
            var actual = parser.compressDayTimes(state);
            actual.should.deep.equal(expected);
        });

        it('should compress times', function () {
            var state = {
                tokens: [
                    { type: 'time', value: { ranges: [{ start: 800, end: 1100 }]}},
                    { type: 'time', value: { ranges: [{ start: 1300, end: 1700 }]}}
                ]
            };
            var expected = {
                tokens: [
                    { type: 'time', value: { ranges: [
                        { start: 800, end: 1100 },
                        { start: 1300, end: 1700 }
                    ]}}
                ]
            };
            var actual = parser.compressDayTimes(state);
            actual.should.deep.equal(expected);
        });
    });

    describe('getTimeProfile()', function () {
        it('should return empty object with no params', function () {
            parser.getTimeProfile().should.deep.equal({});
        });

        it('should return a time profile for a set of ranges', function () {
            var ranges = [{ start: 800, end: 930 }, { start: 1700, end: 1800 }];
            var expected = { '800': true, '830': true, '900': true, '1700': true, '1730': true };
            var actual = parser.getTimeProfile(ranges);
            actual.should.deep.equal(expected);
        });
    });

    describe('getDayTimes()', function () {
        it('should get from day - time combos', function () {
            var state = {
                tokens: [
                    { type: 'days', value: ['monday', 'wednesday']},
                    { type: 'time', value: { ranges: [{ start: 1300, end: 1500 }]}}
                ]
            };
            var expected = {
                monday: {
                    '1300': true,
                    '1330': true,
                    '1400': true,
                    '1430': true
                },
                wednesday: {
                    '1300': true,
                    '1330': true,
                    '1400': true,
                    '1430': true
                },
                timezone: 'est'
            };
            var actual = parser.getDayTimes(state);
            actual.should.deep.equal(expected);
        });
    });

    describe('parse()', function () {
        it('should return an empty object if an invalid string', function () {
            parser.parse('invalid string here', { noLog: true }).should.deep.equal({ timezone: 'est' });
        });

        it('should parse out string Monday-Wednesday 11:30am-1pm', function () {
            var hrsText = 'Monday-Wednesday 11:30am-1pm';
            var expected = {
                monday: {  '1130': true, '1200': true, '1230': true  },
                tuesday: {  '1130': true, '1200': true, '1230': true  },
                wednesday: {  '1130': true, '1200': true, '1230': true  },
                timezone: 'est'
            };
            var actual = parser.parse(hrsText);
            actual.should.deep.equal(expected);
        });

        it('should parse out string 24 hours, 7 days', function () {
            var hrsText = '24 hours, 7 days';
            var expected = { everyDayAllTime: true };
            var actual = parser.parse(hrsText);
            actual.should.deep.equal(expected);
        });
    });
});