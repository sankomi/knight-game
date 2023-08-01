const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();

const index = require("../index");

chai.use(chaiHttp);

describe("api", () => {
	describe("PUT /sit/", () => {
		it("should return 400 if id/side missing", done => {
			chai.request(index)
				.put("/sit/")
				.end((err, res) => {
					res.should.have.status(400);
					done();
				});
		});
		it("should return 400 if id missing", done => {
			chai.request(index)
				.put("/sit/")
				.send({side: 0})
				.end((err, res) => {
					res.should.have.status(400);
					done();
				});
		});
		it("should return 400 if side missing", done => {
			chai.request(index)
				.put("/sit/")
				.set("id", "12941918525")
				.end((err, res) => {
					res.should.have.status(400);
					done();
				});
		});
	});
});
