const chai = require("chai");
const should = chai.should();

const game = require("../game");

describe("game.js", () => {
	describe("get()", () => {
		const g = game.get();
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

		let knightUpper = 0, pawnUpper = 0;
		let knightLower = 0, pawnLower = 0;
		for (let i = 0; i < g.board.length; i++) {
			for (let j = 0; j < g.board[i].length; j++) {
				if (g.board[i][j] === "") continue;
				switch (g.board[i][j][0]) {
					case "K":
						knightUpper++;
						break;
					case "P":
						pawnUpper++;
						break;
					case "k":
						knightLower++;
						break;
					case "p":
						pawnLower++;
						break;
					default:
						break;
				}
			}
		}
		it("should have 3 uppercase knights", () => {
			knightUpper.should.equal(3);
		});
		it("should have 4 uppercase pawns", () => {
			pawnUpper.should.equal(4);
		});
		it("should have 3 lowercase knights", () => {
			knightLower.should.equal(3);
		});
		it("should have 4 lowercase pawns", () => {
			pawnLower.should.equal(4);
		});
		it("should have 7 movable pieces", () => {
			g.movable.length.should.equal(7);
		});
	});

	describe("sit()", () => {
		it("user can sit in side 0", () => {
			game.sit(1, "user", 0).should.be.true;
		});
		it("then another user cant sit in side 0", () => {
			game.sit(2, "another user", 0).should.be.false;
		});
		it("but another user can sit in side 1", () => {
			game.sit(2, "another user", 1).should.be.true;
		});
		it("another user cant leave side 0", () => {
			game.unsit(2, 0).should.be.false;
		});
		it("user can leave side 0", () => {
			game.unsit(1, 0).should.be.true;
		});
		it("another user can change side", () => {
			game.sit(2, "another user", 0).should.be.true;
		});
		it("user can sit in side 1 but not change side", () => {
			game.sit(1, "user", 1).should.be.true;
			game.sit(1, "user", 2).should.be.false;
		});
	});
});
