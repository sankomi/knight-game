const chai = require("chai");
const should = chai.should();

const rewire = require("rewire");
let game;
let user, another;
let reverts = [];

function mock(prop, value) {
	reverts.push(game.__set__(prop, value));
}
function revert() {
	reverts.forEach(f => f());
	reverts.length = 0;
};

describe("game.js", () => {
	before(() => {
		game = rewire("../game");
		user = {id: 1, name: "user"};
		another = {id: 2, name: "another"};
	});
	afterEach(revert);

	describe("get()", () => {
		let g;
		function count(piece) {
			let n = 0;
			for (let i = 0; i < g.board.length; i++) {
				for (let j = 0; j < g.board[i].length; j++) {
					if (g.board[i][j] === "") continue;
					if (g.board[i][j][0] === piece) {
						n++;
					}
				}
			}
			return n;
		}

		describe("initially", () => {
			before(() => g = game.get());

			it("turn should equal 0", () => {
				g.turn.should.equal(0);
			});
			it("player should equal 0", () => {
				g.player.should.equal(0);
			});
			it("moved should equal 0", () => {
				g.moved.should.equal(0);
			});
			it("users should equal [null, null]", () => {
				g.users.should.deep.equal([null, null]);
			});
			it("board height should equal 8", () => {
				g.board.length.should.equal(8);
			});
			it("board width should equal 7", () => {
				for (let i = 0; i < g.board.length; i++) {
					g.board[i].length.should.equal(7);
				}
			});
			it("should have 3 uppercase knights", () => {
				count("K").should.equal(3);
			});
			it("should have 4 uppercase pawns", () => {
				count("P").should.equal(4);
			});
			it("should have 3 lowercase knights", () => {
				count("k").should.equal(3);
			});
			it("should have 4 lowercase pawns", () => {
				count("p").should.equal(4);
			});
			it("should have 7 movable pieces", () => {
				g.movable.length.should.equal(7);
			});
		});
	});

	describe("checkSide()", () => {
		describe("when sits are empty", () => {
			before(() => mock("players", [-1, -1]));

			it("user side should be -1", () => {
				game.__get__("checkSide")(user.id).should.equal(-1);
			});
		});

		describe("when user is side 0", () => {
			before(() => mock("players", [user.id, -1]));
			
			it("user side should be 0", () => {
				game.__get__("checkSide")(user.id).should.equal(0);
			});
		});

		describe("when another is side 1", () => {
			before(() => mock("players", [-1, another.id]));
			
			it("another side should be 1", () => {
				game.__get__("checkSide")(another.id).should.equal(1);
			});
		});
	});

	describe("unsit()", () => {
		describe("when sits are empty", () => {
			beforeEach(() => {
				mock("players", [-1, -1])
				mock("checkSide", id => -1);
			});

			it("user cant unsit side 0", () => {
				game.unsit(user.id, 0).should.be.false;
			});
			it("another cant unsit side 1", () => {
				game.unsit(another.id, 1).should.be.false;
			});
			it("user cant unsit side null", () => {
				game.unsit(user.id, null).should.be.false;
			});
			it("user cant unsit side 2", () => {
				game.unsit(user.id, 2).should.be.false;
			});
		});
		describe("when user is on side 0", () => {
			beforeEach(() => {
				mock("players", [user.id, -1]);
				mock("checkSide", id => {
					if (id === user.id) return 0;
					else return -1;
				});
			});

			it("user can unsit side 0", () => {
				game.unsit(user.id, 0).should.be.true;
				game.__get__("players")[0].should.equal(-1);
			});
			it("user can unsit side null", () => {
				game.unsit(user.id, null).should.be.true;
				game.__get__("players")[0].should.equal(-1);
			});
			it("another cant unsit side 0", () => {
				game.unsit(another.id, 0).should.be.false;
			});
		});
	});

	describe("sit()", () => {
		describe("when sits are empty", () => {
			beforeEach(() => {
				mock("players", [-1, -1]);
				mock("unsit", (id, side) => null);
			});

			it("user can sit side 0", () => {
				game.sit(user.id, user.name, 0).should.be.true;
				game.__get__("players")[0].should.equal(user.id);
			});
			it("another can sit side 1", () => {
				game.sit(another.id, another.name, 1).should.be.true;
				game.__get__("players")[1].should.equal(another.id);
			});
			it("user cant sit side 2", () => {
				game.sit(user.id, user.name, 2).should.be.false;
				game.__get__("players")[0].should.equal(-1);
				game.__get__("players")[1].should.equal(-1);
			});
		});
	});
});
