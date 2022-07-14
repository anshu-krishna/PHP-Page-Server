PegJSON = (function () {
	"use strict";

	function peg_subclass(child, parent) {
		function C() { this.constructor = child; }
		C.prototype = parent.prototype;
		child.prototype = new C();
	}

	function peg_SyntaxError(message, expected, found, location) {
		let self = Error.call(this, message);
		// istanbul ignore next Check is a necessary evil to support older environments
		if (Object.setPrototypeOf) {
			Object.setPrototypeOf(self, peg_SyntaxError.prototype);
		}
		self.expected = expected;
		self.found = found;
		self.location = location;
		self.name = "SyntaxError";
		return self;
	}

	peg_subclass(peg_SyntaxError, Error);

	function peg_padEnd(str, targetLength, padString) {
		padString = padString || " ";
		if (str.length > targetLength) { return str; }
		targetLength -= str.length;
		padString += padString.repeat(targetLength);
		return str + padString.slice(0, targetLength);
	}

	peg_SyntaxError.prototype.format = function (sources) {
		let str = "Error: " + this.message;
		if (this.location) {
			let src = null;
			let k;
			for (k = 0; k < sources.length; k++) {
				if (sources[k].source === this.location.source) {
					src = sources[k].text.split(/\r\n|\n|\r/g);
					break;
				}
			}
			let s = this.location.start;
			let loc = this.location.source + ":" + s.line + ":" + s.column;
			if (src) {
				let e = this.location.end;
				let filler = peg_padEnd("", s.line.toString().length, ' ');
				let line = src[s.line - 1];
				let last = s.line === e.line ? e.column : line.length + 1;
				let hatLen = (last - s.column) || 1;
				str += "\n --> " + loc + "\n"
					+ filler + " |\n"
					+ s.line + " | " + line + "\n"
					+ filler + " | " + peg_padEnd("", s.column - 1, ' ')
					+ peg_padEnd("", hatLen, "^");
			} else {
				str += "\n at " + loc;
			}
		}
		return str;
	};

	peg_SyntaxError.buildMessage = function (expected, found) {
		let DESCRIBE_EXPECTATION_FNS = {
			literal: function (expectation) {
				return "\"" + literalEscape(expectation.text) + "\"";
			},

			class: function (expectation) {
				let escapedParts = expectation.parts.map(function (part) {
					return Array.isArray(part)
						? classEscape(part[0]) + "-" + classEscape(part[1])
						: classEscape(part);
				});

				return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
			},

			any: function () {
				return "any character";
			},

			end: function () {
				return "end of input";
			},

			other: function (expectation) {
				return expectation.description;
			}
		};

		function hex(ch) {
			return ch.charCodeAt(0).toString(16).toUpperCase();
		}

		function literalEscape(s) {
			return s
				.replace(/\\/g, "\\\\")
				.replace(/"/g, "\\\"")
				.replace(/\0/g, "\\0")
				.replace(/\t/g, "\\t")
				.replace(/\n/g, "\\n")
				.replace(/\r/g, "\\r")
				.replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
				.replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
		}

		function classEscape(s) {
			return s
				.replace(/\\/g, "\\\\")
				.replace(/\]/g, "\\]")
				.replace(/\^/g, "\\^")
				.replace(/-/g, "\\-")
				.replace(/\0/g, "\\0")
				.replace(/\t/g, "\\t")
				.replace(/\n/g, "\\n")
				.replace(/\r/g, "\\r")
				.replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
				.replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
		}

		function describeExpectation(expectation) {
			return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
		}

		function describeExpected(expected) {
			let descriptions = expected.map(describeExpectation);
			let i, j;

			descriptions.sort();

			if (descriptions.length > 0) {
				for (i = 1, j = 1; i < descriptions.length; i++) {
					if (descriptions[i - 1] !== descriptions[i]) {
						descriptions[j] = descriptions[i];
						j++;
					}
				}
				descriptions.length = j;
			}

			switch (descriptions.length) {
				case 1:
					return descriptions[0];

				case 2:
					return descriptions[0] + " or " + descriptions[1];

				default:
					return descriptions.slice(0, -1).join(", ")
						+ ", or "
						+ descriptions[descriptions.length - 1];
			}
		}

		function describeFound(found) {
			return found ? "\"" + literalEscape(found) + "\"" : "end of input";
		}

		return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
	};

	function peg_parse(input, options) {
		options = options !== undefined ? options : {};

		let peg_FAILED = {};
		let peg_source = options.grammarSource;

		let peg_startRuleFunctions = { Value: peg_parseValue };
		let peg_startRuleFunction = peg_parseValue;

		let peg_c0 = "null";
		let peg_c1 = "undefined";
		let peg_c2 = "false";
		let peg_c3 = "true";
		let peg_c4 = "-";
		let peg_c5 = "0x";
		let peg_c6 = "0o";
		let peg_c7 = "0b";
		let peg_c8 = ".";
		let peg_c9 = "+";
		let peg_c10 = "\"";
		let peg_c11 = "'";
		let peg_c12 = "`";
		let peg_c13 = "\\\\";
		let peg_c14 = "\\\"";
		let peg_c15 = "\\'";
		let peg_c16 = "\\`";
		let peg_c17 = "\\b";
		let peg_c18 = "\\f";
		let peg_c19 = "\\n";
		let peg_c20 = "\\r";
		let peg_c21 = "\\t";
		let peg_c22 = "\\0";
		let peg_c23 = "\\x";
		let peg_c24 = "\\u";
		let peg_c25 = "/*";
		let peg_c26 = "*";
		let peg_c27 = "*/";
		let peg_c28 = "//";
		let peg_c29 = ",";
		let peg_c30 = ":";
		let peg_c31 = "[";
		let peg_c32 = "]";
		let peg_c33 = "{";
		let peg_c34 = "}";
		let peg_c35 = "(";
		let peg_c36 = ")";

		let peg_r0 = /^[0-7]/;
		let peg_r1 = /^[0-1]/;
		let peg_r2 = /^[eE]/;
		let peg_r3 = /^[^\0-\x1F\\"]/;
		let peg_r4 = /^[^\0-\x1F\\']/;
		let peg_r5 = /^[^\0-\x1F\\`]/;
		let peg_r6 = /^[\n]/;
		let peg_r7 = /^[\t]/;
		let peg_r8 = /^[ \t\n\r]/;
		let peg_r9 = /^[^*]/;
		let peg_r10 = /^[\/]/;
		let peg_r11 = /^[^\n]/;
		let peg_r12 = /^[0-9a-f]/i;
		let peg_r13 = /^[0-9]/;
		let peg_r14 = /^[_a-z$]/i;
		let peg_r15 = /^[0-9a-z$_]/i;

		let peg_e0 = peg_otherExpectation("object");
		let peg_e1 = peg_otherExpectation("key:val pair");
		let peg_e2 = peg_otherExpectation("array");
		let peg_e3 = peg_otherExpectation("null");
		let peg_e4 = peg_literalExpectation("null", false);
		let peg_e5 = peg_otherExpectation("undefined");
		let peg_e6 = peg_literalExpectation("undefined", false);
		let peg_e7 = peg_literalExpectation("false", false);
		let peg_e8 = peg_literalExpectation("true", false);
		let peg_e9 = peg_otherExpectation("number");
		let peg_e10 = peg_literalExpectation("-", false);
		let peg_e11 = peg_literalExpectation("0x", false);
		let peg_e12 = peg_literalExpectation("0o", false);
		let peg_e13 = peg_classExpectation([["0", "7"]], false, false);
		let peg_e14 = peg_literalExpectation("0b", false);
		let peg_e15 = peg_classExpectation([["0", "1"]], false, false);
		let peg_e16 = peg_literalExpectation(".", false);
		let peg_e17 = peg_classExpectation(["e", "E"], false, false);
		let peg_e18 = peg_literalExpectation("+", false);
		let peg_e19 = peg_otherExpectation("string");
		let peg_e20 = peg_literalExpectation("\"", false);
		let peg_e21 = peg_classExpectation([["\0", "\x1F"], "\\", "\""], true, false);
		let peg_e22 = peg_literalExpectation("'", false);
		let peg_e23 = peg_classExpectation([["\0", "\x1F"], "\\", "'"], true, false);
		let peg_e24 = peg_literalExpectation("`", false);
		let peg_e25 = peg_classExpectation([["\0", "\x1F"], "\\", "`"], true, false);
		let peg_e26 = peg_literalExpectation("\\\\", false);
		let peg_e27 = peg_literalExpectation("\\\"", false);
		let peg_e28 = peg_literalExpectation("\\'", false);
		let peg_e29 = peg_literalExpectation("\\`", false);
		let peg_e30 = peg_literalExpectation("\\b", false);
		let peg_e31 = peg_literalExpectation("\\f", false);
		let peg_e32 = peg_literalExpectation("\\n", false);
		let peg_e33 = peg_literalExpectation("\\r", false);
		let peg_e34 = peg_literalExpectation("\\t", false);
		let peg_e35 = peg_literalExpectation("\\0", false);
		let peg_e36 = peg_literalExpectation("\\x", false);
		let peg_e37 = peg_literalExpectation("\\u", false);
		let peg_e38 = peg_classExpectation(["\n"], false, false);
		let peg_e39 = peg_classExpectation(["\t"], false, false);
		let peg_e40 = peg_otherExpectation("whitespace");
		let peg_e41 = peg_classExpectation([" ", "\t", "\n", "\r"], false, false);
		let peg_e42 = peg_otherExpectation("Comment");
		let peg_e43 = peg_literalExpectation("/*", false);
		let peg_e44 = peg_classExpectation(["*"], true, false);
		let peg_e45 = peg_literalExpectation("*", false);
		let peg_e46 = peg_classExpectation(["/"], false, false);
		let peg_e47 = peg_literalExpectation("*/", false);
		let peg_e48 = peg_literalExpectation("//", false);
		let peg_e49 = peg_classExpectation(["\n"], true, false);
		let peg_e50 = peg_otherExpectation("hex-char");
		let peg_e51 = peg_classExpectation([["0", "9"], ["a", "f"]], false, true);
		let peg_e52 = peg_otherExpectation("digit");
		let peg_e53 = peg_classExpectation([["0", "9"]], false, false);
		let peg_e54 = peg_otherExpectation("identifier");
		let peg_e55 = peg_classExpectation(["_", ["a", "z"], "$"], false, true);
		let peg_e56 = peg_classExpectation([["0", "9"], ["a", "z"], "$", "_"], false, true);
		let peg_e57 = peg_literalExpectation(",", false);
		let peg_e58 = peg_literalExpectation(":", false);
		let peg_e59 = peg_literalExpectation("[", false);
		let peg_e60 = peg_literalExpectation("]", false);
		let peg_e61 = peg_literalExpectation("{", false);
		let peg_e62 = peg_literalExpectation("}", false);
		let peg_e63 = peg_literalExpectation("(", false);
		let peg_e64 = peg_literalExpectation(")", false);

		let peg_f0 = function (v) { return v; };
		let peg_f1 = function (v) { return v; };
		let peg_f2 = function (head, tail) { return Object.fromEntries([head, ...tail]); };
		let peg_f3 = function (members) { return members !== null ? members : {}; };
		let peg_f4 = function (name, value) { return [name, value]; };
		let peg_f5 = function (head, tail) { return [head, ...tail]; };
		let peg_f6 = function (values) { return values ?? []; };
		let peg_f7 = function () { return null; };
		let peg_f8 = function () { return undefined; };
		let peg_f9 = function () { return false; };
		let peg_f10 = function () { return true; };
		let peg_f11 = function (neg, digits) { return parseInt(`${neg ?? ''}${digits}`, 16); };
		let peg_f12 = function (neg, digits) { return parseInt(`${neg ?? ''}${digits}`, 8); };
		let peg_f13 = function (neg, digits) { return parseInt(`${neg ?? ''}${digits}`, 2); };
		let peg_f14 = function () { return parseFloat(text()); };
		let peg_f15 = function (chars) { return chars.join(""); };
		let peg_f16 = function (chars) { return chars.join(""); };
		let peg_f17 = function (chars) { return chars.join(""); };
		let peg_f18 = function () { return '\\'; };
		let peg_f19 = function () { return '"'; };
		let peg_f20 = function () { return "'"; };
		let peg_f21 = function () { return '`'; };
		let peg_f22 = function () { return '\b'; };
		let peg_f23 = function () { return '\f'; };
		let peg_f24 = function () { return '\n'; };
		let peg_f25 = function () { return '\r'; };
		let peg_f26 = function () { return '\t'; };
		let peg_f27 = function (digits) { return String.fromCharCode(parseInt(digits, 8)); };
		let peg_f28 = function (digits) { return String.fromCharCode(parseInt(digits, 16)); };
		let peg_f29 = function (digits) { return String.fromCharCode(parseInt(digits, 16)); };
		let peg_currPos = 0;
		let peg_savedPos = 0;
		let peg_posDetailsCache = [{ line: 1, column: 1 }];
		let peg_maxFailPos = 0;
		let peg_maxFailExpected = [];
		let peg_silentFails = 0;

		let peg_result;

		if ("startRule" in options) {
			if (!(options.startRule in peg_startRuleFunctions)) {
				throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
			}

			peg_startRuleFunction = peg_startRuleFunctions[options.startRule];
		}

		function text() {
			return input.substring(peg_savedPos, peg_currPos);
		}

		function offset() {
			return peg_savedPos;
		}

		function range() {
			return {
				source: peg_source,
				start: peg_savedPos,
				end: peg_currPos
			};
		}

		function location() {
			return peg_computeLocation(peg_savedPos, peg_currPos);
		}

		function expected(description, location) {
			location = location !== undefined
				? location
				: peg_computeLocation(peg_savedPos, peg_currPos);

			throw peg_buildStructuredError(
				[peg_otherExpectation(description)],
				input.substring(peg_savedPos, peg_currPos),
				location
			);
		}

		function error(message, location) {
			location = location !== undefined
				? location
				: peg_computeLocation(peg_savedPos, peg_currPos);

			throw peg_buildSimpleError(message, location);
		}

		function peg_literalExpectation(text, ignoreCase) {
			return { type: "literal", text: text, ignoreCase: ignoreCase };
		}

		function peg_classExpectation(parts, inverted, ignoreCase) {
			return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
		}

		function peg_anyExpectation() {
			return { type: "any" };
		}

		function peg_endExpectation() {
			return { type: "end" };
		}

		function peg_otherExpectation(description) {
			return { type: "other", description: description };
		}

		function peg_computePosDetails(pos) {
			let details = peg_posDetailsCache[pos];
			let p;

			if (details) {
				return details;
			} else {
				p = pos - 1;
				while (!peg_posDetailsCache[p]) {
					p--;
				}

				details = peg_posDetailsCache[p];
				details = {
					line: details.line,
					column: details.column
				};

				while (p < pos) {
					if (input.charCodeAt(p) === 10) {
						details.line++;
						details.column = 1;
					} else {
						details.column++;
					}

					p++;
				}

				peg_posDetailsCache[pos] = details;

				return details;
			}
		}

		function peg_computeLocation(startPos, endPos) {
			let startPosDetails = peg_computePosDetails(startPos);
			let endPosDetails = peg_computePosDetails(endPos);

			return {
				source: peg_source,
				start: {
					offset: startPos,
					line: startPosDetails.line,
					column: startPosDetails.column
				},
				end: {
					offset: endPos,
					line: endPosDetails.line,
					column: endPosDetails.column
				}
			};
		}

		function peg_fail(expected) {
			if (peg_currPos < peg_maxFailPos) { return; }

			if (peg_currPos > peg_maxFailPos) {
				peg_maxFailPos = peg_currPos;
				peg_maxFailExpected = [];
			}

			peg_maxFailExpected.push(expected);
		}

		function peg_buildSimpleError(message, location) {
			return new peg_SyntaxError(message, null, null, location);
		}

		function peg_buildStructuredError(expected, found, location) {
			return new peg_SyntaxError(
				peg_SyntaxError.buildMessage(expected, found),
				expected,
				found,
				location
			);
		}

		function peg_parseValue() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parseOB();
			if (s1 !== peg_FAILED) {
				s2 = peg_parseValue();
				if (s2 !== peg_FAILED) {
					s3 = peg_parseCB();
					if (s3 !== peg_FAILED) {
						peg_savedPos = s0;
						s0 = peg_f0(s2);
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				s1 = peg_parse_();
				s2 = peg_parse__Value();
				if (s2 !== peg_FAILED) {
					s3 = peg_parse_();
					peg_savedPos = s0;
					s0 = peg_f1(s2);
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			}

			return s0;
		}

		function peg_parse__Value() {
			let s0;

			s0 = peg_parseNull();
			if (s0 === peg_FAILED) {
				s0 = peg_parseUndefined();
				if (s0 === peg_FAILED) {
					s0 = peg_parseTrue();
					if (s0 === peg_FAILED) {
						s0 = peg_parseFalse();
						if (s0 === peg_FAILED) {
							s0 = peg_parseNumber();
							if (s0 === peg_FAILED) {
								s0 = peg_parseString();
								if (s0 === peg_FAILED) {
									s0 = peg_parseObject();
									if (s0 === peg_FAILED) {
										s0 = peg_parseArray();
									}
								}
							}
						}
					}
				}
			}

			return s0;
		}

		function peg_parseObject() {
			let s0, s1, s2, s3, s4, s5, s6, s7;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_parseOCB();
			if (s1 !== peg_FAILED) {
				s2 = peg_currPos;
				s3 = peg_parse__KeyVal();
				if (s3 !== peg_FAILED) {
					s4 = [];
					s5 = peg_currPos;
					s6 = peg_parseCOMMA();
					if (s6 !== peg_FAILED) {
						s7 = peg_parse__KeyVal();
						if (s7 !== peg_FAILED) {
							s5 = s7;
						} else {
							peg_currPos = s5;
							s5 = peg_FAILED;
						}
					} else {
						peg_currPos = s5;
						s5 = peg_FAILED;
					}
					while (s5 !== peg_FAILED) {
						s4.push(s5);
						s5 = peg_currPos;
						s6 = peg_parseCOMMA();
						if (s6 !== peg_FAILED) {
							s7 = peg_parse__KeyVal();
							if (s7 !== peg_FAILED) {
								s5 = s7;
							} else {
								peg_currPos = s5;
								s5 = peg_FAILED;
							}
						} else {
							peg_currPos = s5;
							s5 = peg_FAILED;
						}
					}
					peg_savedPos = s2;
					s2 = peg_f2(s3, s4);
				} else {
					peg_currPos = s2;
					s2 = peg_FAILED;
				}
				if (s2 === peg_FAILED) {
					s2 = null;
				}
				s3 = peg_parseCOMMA();
				if (s3 === peg_FAILED) {
					s3 = null;
				}
				s4 = peg_parseCCB();
				if (s4 !== peg_FAILED) {
					peg_savedPos = s0;
					s0 = peg_f3(s2);
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e0); }
			}

			return s0;
		}

		function peg_parse__KeyVal() {
			let s0, s1, s2, s3;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_parseString();
			if (s1 === peg_FAILED) {
				s1 = peg_parseIden();
			}
			if (s1 !== peg_FAILED) {
				s2 = peg_parseCOLON();
				if (s2 !== peg_FAILED) {
					s3 = peg_parseValue();
					if (s3 !== peg_FAILED) {
						peg_savedPos = s0;
						s0 = peg_f4(s1, s3);
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e1); }
			}

			return s0;
		}

		function peg_parseArray() {
			let s0, s1, s2, s3, s4, s5, s6, s7;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_parseOSB();
			if (s1 !== peg_FAILED) {
				s2 = peg_currPos;
				s3 = peg_parseValue();
				if (s3 !== peg_FAILED) {
					s4 = [];
					s5 = peg_currPos;
					s6 = peg_parseCOMMA();
					if (s6 !== peg_FAILED) {
						s7 = peg_parseValue();
						if (s7 !== peg_FAILED) {
							s5 = s7;
						} else {
							peg_currPos = s5;
							s5 = peg_FAILED;
						}
					} else {
						peg_currPos = s5;
						s5 = peg_FAILED;
					}
					while (s5 !== peg_FAILED) {
						s4.push(s5);
						s5 = peg_currPos;
						s6 = peg_parseCOMMA();
						if (s6 !== peg_FAILED) {
							s7 = peg_parseValue();
							if (s7 !== peg_FAILED) {
								s5 = s7;
							} else {
								peg_currPos = s5;
								s5 = peg_FAILED;
							}
						} else {
							peg_currPos = s5;
							s5 = peg_FAILED;
						}
					}
					peg_savedPos = s2;
					s2 = peg_f5(s3, s4);
				} else {
					peg_currPos = s2;
					s2 = peg_FAILED;
				}
				if (s2 === peg_FAILED) {
					s2 = null;
				}
				s3 = peg_parseCOMMA();
				if (s3 === peg_FAILED) {
					s3 = null;
				}
				s4 = peg_parseCSB();
				if (s4 !== peg_FAILED) {
					peg_savedPos = s0;
					s0 = peg_f6(s2);
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e2); }
			}

			return s0;
		}

		function peg_parseNull() {
			let s0, s1;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.substr(peg_currPos, 4) === peg_c0) {
				s1 = peg_c0;
				peg_currPos += 4;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e4); }
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_f7();
			}
			s0 = s1;
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e3); }
			}

			return s0;
		}

		function peg_parseUndefined() {
			let s0, s1;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.substr(peg_currPos, 9) === peg_c1) {
				s1 = peg_c1;
				peg_currPos += 9;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e6); }
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_f8();
			}
			s0 = s1;
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e5); }
			}

			return s0;
		}

		function peg_parseFalse() {
			let s0, s1;

			s0 = peg_currPos;
			if (input.substr(peg_currPos, 5) === peg_c2) {
				s1 = peg_c2;
				peg_currPos += 5;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e7); }
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_f9();
			}
			s0 = s1;

			return s0;
		}

		function peg_parseTrue() {
			let s0, s1;

			s0 = peg_currPos;
			if (input.substr(peg_currPos, 4) === peg_c3) {
				s1 = peg_c3;
				peg_currPos += 4;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e8); }
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_f10();
			}
			s0 = s1;

			return s0;
		}

		function peg_parseNumber() {
			let s0, s1, s2, s3, s4, s5, s6, s7, s8;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.charCodeAt(peg_currPos) === 45) {
				s1 = peg_c4;
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e10); }
			}
			if (s1 === peg_FAILED) {
				s1 = null;
			}
			if (input.substr(peg_currPos, 2) === peg_c5) {
				s2 = peg_c5;
				peg_currPos += 2;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e11); }
			}
			if (s2 !== peg_FAILED) {
				s3 = peg_currPos;
				s4 = [];
				s5 = peg_parseHexDigit();
				if (s5 !== peg_FAILED) {
					while (s5 !== peg_FAILED) {
						s4.push(s5);
						s5 = peg_parseHexDigit();
					}
				} else {
					s4 = peg_FAILED;
				}
				if (s4 !== peg_FAILED) {
					s3 = input.substring(s3, peg_currPos);
				} else {
					s3 = s4;
				}
				if (s3 !== peg_FAILED) {
					peg_savedPos = s0;
					s0 = peg_f11(s1, s3);
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				if (input.charCodeAt(peg_currPos) === 45) {
					s1 = peg_c4;
					peg_currPos++;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e10); }
				}
				if (s1 === peg_FAILED) {
					s1 = null;
				}
				if (input.substr(peg_currPos, 2) === peg_c6) {
					s2 = peg_c6;
					peg_currPos += 2;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e12); }
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_currPos;
					s4 = [];
					if (peg_r0.test(input.charAt(peg_currPos))) {
						s5 = input.charAt(peg_currPos);
						peg_currPos++;
					} else {
						s5 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e13); }
					}
					if (s5 !== peg_FAILED) {
						while (s5 !== peg_FAILED) {
							s4.push(s5);
							if (peg_r0.test(input.charAt(peg_currPos))) {
								s5 = input.charAt(peg_currPos);
								peg_currPos++;
							} else {
								s5 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_e13); }
							}
						}
					} else {
						s4 = peg_FAILED;
					}
					if (s4 !== peg_FAILED) {
						s3 = input.substring(s3, peg_currPos);
					} else {
						s3 = s4;
					}
					if (s3 !== peg_FAILED) {
						peg_savedPos = s0;
						s0 = peg_f12(s1, s3);
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
				if (s0 === peg_FAILED) {
					s0 = peg_currPos;
					if (input.charCodeAt(peg_currPos) === 45) {
						s1 = peg_c4;
						peg_currPos++;
					} else {
						s1 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e10); }
					}
					if (s1 === peg_FAILED) {
						s1 = null;
					}
					if (input.substr(peg_currPos, 2) === peg_c7) {
						s2 = peg_c7;
						peg_currPos += 2;
					} else {
						s2 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e14); }
					}
					if (s2 !== peg_FAILED) {
						s3 = peg_currPos;
						s4 = [];
						if (peg_r1.test(input.charAt(peg_currPos))) {
							s5 = input.charAt(peg_currPos);
							peg_currPos++;
						} else {
							s5 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_e15); }
						}
						if (s5 !== peg_FAILED) {
							while (s5 !== peg_FAILED) {
								s4.push(s5);
								if (peg_r1.test(input.charAt(peg_currPos))) {
									s5 = input.charAt(peg_currPos);
									peg_currPos++;
								} else {
									s5 = peg_FAILED;
									if (peg_silentFails === 0) { peg_fail(peg_e15); }
								}
							}
						} else {
							s4 = peg_FAILED;
						}
						if (s4 !== peg_FAILED) {
							s3 = input.substring(s3, peg_currPos);
						} else {
							s3 = s4;
						}
						if (s3 !== peg_FAILED) {
							peg_savedPos = s0;
							s0 = peg_f13(s1, s3);
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
					if (s0 === peg_FAILED) {
						s0 = peg_currPos;
						if (input.charCodeAt(peg_currPos) === 45) {
							s1 = peg_c4;
							peg_currPos++;
						} else {
							s1 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_e10); }
						}
						if (s1 === peg_FAILED) {
							s1 = null;
						}
						s2 = [];
						s3 = peg_parseDigit();
						if (s3 !== peg_FAILED) {
							while (s3 !== peg_FAILED) {
								s2.push(s3);
								s3 = peg_parseDigit();
							}
						} else {
							s2 = peg_FAILED;
						}
						if (s2 !== peg_FAILED) {
							s3 = peg_currPos;
							if (input.charCodeAt(peg_currPos) === 46) {
								s4 = peg_c8;
								peg_currPos++;
							} else {
								s4 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_e16); }
							}
							if (s4 !== peg_FAILED) {
								s5 = [];
								s6 = peg_parseDigit();
								if (s6 !== peg_FAILED) {
									while (s6 !== peg_FAILED) {
										s5.push(s6);
										s6 = peg_parseDigit();
									}
								} else {
									s5 = peg_FAILED;
								}
								if (s5 !== peg_FAILED) {
									s4 = [s4, s5];
									s3 = s4;
								} else {
									peg_currPos = s3;
									s3 = peg_FAILED;
								}
							} else {
								peg_currPos = s3;
								s3 = peg_FAILED;
							}
							if (s3 === peg_FAILED) {
								s3 = null;
							}
							s4 = peg_currPos;
							if (peg_r2.test(input.charAt(peg_currPos))) {
								s5 = input.charAt(peg_currPos);
								peg_currPos++;
							} else {
								s5 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_e17); }
							}
							if (s5 !== peg_FAILED) {
								if (input.charCodeAt(peg_currPos) === 45) {
									s6 = peg_c4;
									peg_currPos++;
								} else {
									s6 = peg_FAILED;
									if (peg_silentFails === 0) { peg_fail(peg_e10); }
								}
								if (s6 === peg_FAILED) {
									if (input.charCodeAt(peg_currPos) === 43) {
										s6 = peg_c9;
										peg_currPos++;
									} else {
										s6 = peg_FAILED;
										if (peg_silentFails === 0) { peg_fail(peg_e18); }
									}
								}
								if (s6 === peg_FAILED) {
									s6 = null;
								}
								s7 = [];
								s8 = peg_parseDigit();
								if (s8 !== peg_FAILED) {
									while (s8 !== peg_FAILED) {
										s7.push(s8);
										s8 = peg_parseDigit();
									}
								} else {
									s7 = peg_FAILED;
								}
								if (s7 !== peg_FAILED) {
									s5 = [s5, s6, s7];
									s4 = s5;
								} else {
									peg_currPos = s4;
									s4 = peg_FAILED;
								}
							} else {
								peg_currPos = s4;
								s4 = peg_FAILED;
							}
							if (s4 === peg_FAILED) {
								s4 = null;
							}
							peg_savedPos = s0;
							s0 = peg_f14();
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					}
				}
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e9); }
			}

			return s0;
		}

		function peg_parseString() {
			let s0, s1, s2, s3;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.charCodeAt(peg_currPos) === 34) {
				s1 = peg_c10;
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e20); }
			}
			if (s1 !== peg_FAILED) {
				s2 = [];
				if (peg_r3.test(input.charAt(peg_currPos))) {
					s3 = input.charAt(peg_currPos);
					peg_currPos++;
				} else {
					s3 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e21); }
				}
				if (s3 === peg_FAILED) {
					s3 = peg_parse__SpecialChar();
				}
				while (s3 !== peg_FAILED) {
					s2.push(s3);
					if (peg_r3.test(input.charAt(peg_currPos))) {
						s3 = input.charAt(peg_currPos);
						peg_currPos++;
					} else {
						s3 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e21); }
					}
					if (s3 === peg_FAILED) {
						s3 = peg_parse__SpecialChar();
					}
				}
				if (input.charCodeAt(peg_currPos) === 34) {
					s3 = peg_c10;
					peg_currPos++;
				} else {
					s3 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e20); }
				}
				if (s3 !== peg_FAILED) {
					peg_savedPos = s0;
					s0 = peg_f15(s2);
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				if (input.charCodeAt(peg_currPos) === 39) {
					s1 = peg_c11;
					peg_currPos++;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e22); }
				}
				if (s1 !== peg_FAILED) {
					s2 = [];
					if (peg_r4.test(input.charAt(peg_currPos))) {
						s3 = input.charAt(peg_currPos);
						peg_currPos++;
					} else {
						s3 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e23); }
					}
					if (s3 === peg_FAILED) {
						s3 = peg_parse__SpecialChar();
					}
					while (s3 !== peg_FAILED) {
						s2.push(s3);
						if (peg_r4.test(input.charAt(peg_currPos))) {
							s3 = input.charAt(peg_currPos);
							peg_currPos++;
						} else {
							s3 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_e23); }
						}
						if (s3 === peg_FAILED) {
							s3 = peg_parse__SpecialChar();
						}
					}
					if (input.charCodeAt(peg_currPos) === 39) {
						s3 = peg_c11;
						peg_currPos++;
					} else {
						s3 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e22); }
					}
					if (s3 !== peg_FAILED) {
						peg_savedPos = s0;
						s0 = peg_f16(s2);
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
				if (s0 === peg_FAILED) {
					s0 = peg_currPos;
					if (input.charCodeAt(peg_currPos) === 96) {
						s1 = peg_c12;
						peg_currPos++;
					} else {
						s1 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e24); }
					}
					if (s1 !== peg_FAILED) {
						s2 = [];
						if (peg_r5.test(input.charAt(peg_currPos))) {
							s3 = input.charAt(peg_currPos);
							peg_currPos++;
						} else {
							s3 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_e25); }
						}
						if (s3 === peg_FAILED) {
							s3 = peg_parse__SpecialChar();
						}
						while (s3 !== peg_FAILED) {
							s2.push(s3);
							if (peg_r5.test(input.charAt(peg_currPos))) {
								s3 = input.charAt(peg_currPos);
								peg_currPos++;
							} else {
								s3 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_e25); }
							}
							if (s3 === peg_FAILED) {
								s3 = peg_parse__SpecialChar();
							}
						}
						if (input.charCodeAt(peg_currPos) === 96) {
							s3 = peg_c12;
							peg_currPos++;
						} else {
							s3 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_e24); }
						}
						if (s3 !== peg_FAILED) {
							peg_savedPos = s0;
							s0 = peg_f17(s2);
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				}
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e19); }
			}

			return s0;
		}

		function peg_parse__SpecialChar() {
			let s0, s1, s2, s3, s4, s5, s6, s7;

			s0 = peg_currPos;
			if (input.substr(peg_currPos, 2) === peg_c13) {
				s1 = peg_c13;
				peg_currPos += 2;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e26); }
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_f18();
			}
			s0 = s1;
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				if (input.substr(peg_currPos, 2) === peg_c14) {
					s1 = peg_c14;
					peg_currPos += 2;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e27); }
				}
				if (s1 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_f19();
				}
				s0 = s1;
				if (s0 === peg_FAILED) {
					s0 = peg_currPos;
					if (input.substr(peg_currPos, 2) === peg_c15) {
						s1 = peg_c15;
						peg_currPos += 2;
					} else {
						s1 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e28); }
					}
					if (s1 !== peg_FAILED) {
						peg_savedPos = s0;
						s1 = peg_f20();
					}
					s0 = s1;
					if (s0 === peg_FAILED) {
						s0 = peg_currPos;
						if (input.substr(peg_currPos, 2) === peg_c16) {
							s1 = peg_c16;
							peg_currPos += 2;
						} else {
							s1 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_e29); }
						}
						if (s1 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_f21();
						}
						s0 = s1;
						if (s0 === peg_FAILED) {
							s0 = peg_currPos;
							if (input.substr(peg_currPos, 2) === peg_c17) {
								s1 = peg_c17;
								peg_currPos += 2;
							} else {
								s1 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_e30); }
							}
							if (s1 !== peg_FAILED) {
								peg_savedPos = s0;
								s1 = peg_f22();
							}
							s0 = s1;
							if (s0 === peg_FAILED) {
								s0 = peg_currPos;
								if (input.substr(peg_currPos, 2) === peg_c18) {
									s1 = peg_c18;
									peg_currPos += 2;
								} else {
									s1 = peg_FAILED;
									if (peg_silentFails === 0) { peg_fail(peg_e31); }
								}
								if (s1 !== peg_FAILED) {
									peg_savedPos = s0;
									s1 = peg_f23();
								}
								s0 = s1;
								if (s0 === peg_FAILED) {
									s0 = peg_currPos;
									if (input.substr(peg_currPos, 2) === peg_c19) {
										s1 = peg_c19;
										peg_currPos += 2;
									} else {
										s1 = peg_FAILED;
										if (peg_silentFails === 0) { peg_fail(peg_e32); }
									}
									if (s1 !== peg_FAILED) {
										peg_savedPos = s0;
										s1 = peg_f24();
									}
									s0 = s1;
									if (s0 === peg_FAILED) {
										s0 = peg_currPos;
										if (input.substr(peg_currPos, 2) === peg_c20) {
											s1 = peg_c20;
											peg_currPos += 2;
										} else {
											s1 = peg_FAILED;
											if (peg_silentFails === 0) { peg_fail(peg_e33); }
										}
										if (s1 !== peg_FAILED) {
											peg_savedPos = s0;
											s1 = peg_f25();
										}
										s0 = s1;
										if (s0 === peg_FAILED) {
											s0 = peg_currPos;
											if (input.substr(peg_currPos, 2) === peg_c21) {
												s1 = peg_c21;
												peg_currPos += 2;
											} else {
												s1 = peg_FAILED;
												if (peg_silentFails === 0) { peg_fail(peg_e34); }
											}
											if (s1 !== peg_FAILED) {
												peg_savedPos = s0;
												s1 = peg_f26();
											}
											s0 = s1;
											if (s0 === peg_FAILED) {
												s0 = peg_currPos;
												if (input.substr(peg_currPos, 2) === peg_c22) {
													s1 = peg_c22;
													peg_currPos += 2;
												} else {
													s1 = peg_FAILED;
													if (peg_silentFails === 0) { peg_fail(peg_e35); }
												}
												if (s1 !== peg_FAILED) {
													s2 = peg_currPos;
													s3 = peg_currPos;
													if (peg_r0.test(input.charAt(peg_currPos))) {
														s4 = input.charAt(peg_currPos);
														peg_currPos++;
													} else {
														s4 = peg_FAILED;
														if (peg_silentFails === 0) { peg_fail(peg_e13); }
													}
													if (s4 !== peg_FAILED) {
														if (peg_r0.test(input.charAt(peg_currPos))) {
															s5 = input.charAt(peg_currPos);
															peg_currPos++;
														} else {
															s5 = peg_FAILED;
															if (peg_silentFails === 0) { peg_fail(peg_e13); }
														}
														if (s5 === peg_FAILED) {
															s5 = null;
														}
														if (peg_r0.test(input.charAt(peg_currPos))) {
															s6 = input.charAt(peg_currPos);
															peg_currPos++;
														} else {
															s6 = peg_FAILED;
															if (peg_silentFails === 0) { peg_fail(peg_e13); }
														}
														if (s6 === peg_FAILED) {
															s6 = null;
														}
														s4 = [s4, s5, s6];
														s3 = s4;
													} else {
														peg_currPos = s3;
														s3 = peg_FAILED;
													}
													if (s3 !== peg_FAILED) {
														s2 = input.substring(s2, peg_currPos);
													} else {
														s2 = s3;
													}
													if (s2 !== peg_FAILED) {
														peg_savedPos = s0;
														s0 = peg_f27(s2);
													} else {
														peg_currPos = s0;
														s0 = peg_FAILED;
													}
												} else {
													peg_currPos = s0;
													s0 = peg_FAILED;
												}
												if (s0 === peg_FAILED) {
													s0 = peg_currPos;
													if (input.substr(peg_currPos, 2) === peg_c23) {
														s1 = peg_c23;
														peg_currPos += 2;
													} else {
														s1 = peg_FAILED;
														if (peg_silentFails === 0) { peg_fail(peg_e36); }
													}
													if (s1 !== peg_FAILED) {
														s2 = peg_currPos;
														s3 = peg_currPos;
														s4 = peg_parseHexDigit();
														if (s4 !== peg_FAILED) {
															s5 = peg_parseHexDigit();
															if (s5 === peg_FAILED) {
																s5 = null;
															}
															s4 = [s4, s5];
															s3 = s4;
														} else {
															peg_currPos = s3;
															s3 = peg_FAILED;
														}
														if (s3 !== peg_FAILED) {
															s2 = input.substring(s2, peg_currPos);
														} else {
															s2 = s3;
														}
														if (s2 !== peg_FAILED) {
															peg_savedPos = s0;
															s0 = peg_f28(s2);
														} else {
															peg_currPos = s0;
															s0 = peg_FAILED;
														}
													} else {
														peg_currPos = s0;
														s0 = peg_FAILED;
													}
													if (s0 === peg_FAILED) {
														s0 = peg_currPos;
														if (input.substr(peg_currPos, 2) === peg_c24) {
															s1 = peg_c24;
															peg_currPos += 2;
														} else {
															s1 = peg_FAILED;
															if (peg_silentFails === 0) { peg_fail(peg_e37); }
														}
														if (s1 !== peg_FAILED) {
															s2 = peg_currPos;
															s3 = peg_currPos;
															s4 = peg_parseHexDigit();
															if (s4 !== peg_FAILED) {
																s5 = peg_parseHexDigit();
																if (s5 !== peg_FAILED) {
																	s6 = peg_parseHexDigit();
																	if (s6 !== peg_FAILED) {
																		s7 = peg_parseHexDigit();
																		if (s7 !== peg_FAILED) {
																			s4 = [s4, s5, s6, s7];
																			s3 = s4;
																		} else {
																			peg_currPos = s3;
																			s3 = peg_FAILED;
																		}
																	} else {
																		peg_currPos = s3;
																		s3 = peg_FAILED;
																	}
																} else {
																	peg_currPos = s3;
																	s3 = peg_FAILED;
																}
															} else {
																peg_currPos = s3;
																s3 = peg_FAILED;
															}
															if (s3 !== peg_FAILED) {
																s2 = input.substring(s2, peg_currPos);
															} else {
																s2 = s3;
															}
															if (s2 !== peg_FAILED) {
																peg_savedPos = s0;
																s0 = peg_f29(s2);
															} else {
																peg_currPos = s0;
																s0 = peg_FAILED;
															}
														} else {
															peg_currPos = s0;
															s0 = peg_FAILED;
														}
														if (s0 === peg_FAILED) {
															if (peg_r6.test(input.charAt(peg_currPos))) {
																s0 = input.charAt(peg_currPos);
																peg_currPos++;
															} else {
																s0 = peg_FAILED;
																if (peg_silentFails === 0) { peg_fail(peg_e38); }
															}
															if (s0 === peg_FAILED) {
																if (peg_r7.test(input.charAt(peg_currPos))) {
																	s0 = input.charAt(peg_currPos);
																	peg_currPos++;
																} else {
																	s0 = peg_FAILED;
																	if (peg_silentFails === 0) { peg_fail(peg_e39); }
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}

			return s0;
		}

		function peg_parse_() {
			let s0, s1;

			peg_silentFails++;
			s0 = [];
			if (peg_r8.test(input.charAt(peg_currPos))) {
				s1 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e41); }
			}
			if (s1 === peg_FAILED) {
				s1 = peg_parseComment();
			}
			while (s1 !== peg_FAILED) {
				s0.push(s1);
				if (peg_r8.test(input.charAt(peg_currPos))) {
					s1 = input.charAt(peg_currPos);
					peg_currPos++;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e41); }
				}
				if (s1 === peg_FAILED) {
					s1 = peg_parseComment();
				}
			}
			peg_silentFails--;
			s1 = peg_FAILED;
			if (peg_silentFails === 0) { peg_fail(peg_e40); }

			return s0;
		}

		function peg_parseComment() {
			let s0, s1, s2, s3, s4, s5, s6;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.substr(peg_currPos, 2) === peg_c25) {
				s1 = peg_c25;
				peg_currPos += 2;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e43); }
			}
			if (s1 !== peg_FAILED) {
				s2 = [];
				if (peg_r9.test(input.charAt(peg_currPos))) {
					s3 = input.charAt(peg_currPos);
					peg_currPos++;
				} else {
					s3 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e44); }
				}
				if (s3 === peg_FAILED) {
					s3 = peg_currPos;
					if (input.charCodeAt(peg_currPos) === 42) {
						s4 = peg_c26;
						peg_currPos++;
					} else {
						s4 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e45); }
					}
					if (s4 !== peg_FAILED) {
						s5 = peg_currPos;
						peg_silentFails++;
						if (peg_r10.test(input.charAt(peg_currPos))) {
							s6 = input.charAt(peg_currPos);
							peg_currPos++;
						} else {
							s6 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_e46); }
						}
						peg_silentFails--;
						if (s6 === peg_FAILED) {
							s5 = undefined;
						} else {
							peg_currPos = s5;
							s5 = peg_FAILED;
						}
						if (s5 !== peg_FAILED) {
							s4 = [s4, s5];
							s3 = s4;
						} else {
							peg_currPos = s3;
							s3 = peg_FAILED;
						}
					} else {
						peg_currPos = s3;
						s3 = peg_FAILED;
					}
				}
				while (s3 !== peg_FAILED) {
					s2.push(s3);
					if (peg_r9.test(input.charAt(peg_currPos))) {
						s3 = input.charAt(peg_currPos);
						peg_currPos++;
					} else {
						s3 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e44); }
					}
					if (s3 === peg_FAILED) {
						s3 = peg_currPos;
						if (input.charCodeAt(peg_currPos) === 42) {
							s4 = peg_c26;
							peg_currPos++;
						} else {
							s4 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_e45); }
						}
						if (s4 !== peg_FAILED) {
							s5 = peg_currPos;
							peg_silentFails++;
							if (peg_r10.test(input.charAt(peg_currPos))) {
								s6 = input.charAt(peg_currPos);
								peg_currPos++;
							} else {
								s6 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_e46); }
							}
							peg_silentFails--;
							if (s6 === peg_FAILED) {
								s5 = undefined;
							} else {
								peg_currPos = s5;
								s5 = peg_FAILED;
							}
							if (s5 !== peg_FAILED) {
								s4 = [s4, s5];
								s3 = s4;
							} else {
								peg_currPos = s3;
								s3 = peg_FAILED;
							}
						} else {
							peg_currPos = s3;
							s3 = peg_FAILED;
						}
					}
				}
				if (input.substr(peg_currPos, 2) === peg_c27) {
					s3 = peg_c27;
					peg_currPos += 2;
				} else {
					s3 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e47); }
				}
				if (s3 !== peg_FAILED) {
					s1 = [s1, s2, s3];
					s0 = s1;
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				if (input.substr(peg_currPos, 2) === peg_c28) {
					s1 = peg_c28;
					peg_currPos += 2;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e48); }
				}
				if (s1 !== peg_FAILED) {
					s2 = [];
					if (peg_r11.test(input.charAt(peg_currPos))) {
						s3 = input.charAt(peg_currPos);
						peg_currPos++;
					} else {
						s3 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e49); }
					}
					while (s3 !== peg_FAILED) {
						s2.push(s3);
						if (peg_r11.test(input.charAt(peg_currPos))) {
							s3 = input.charAt(peg_currPos);
							peg_currPos++;
						} else {
							s3 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_e49); }
						}
					}
					if (peg_r6.test(input.charAt(peg_currPos))) {
						s3 = input.charAt(peg_currPos);
						peg_currPos++;
					} else {
						s3 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e38); }
					}
					if (s3 === peg_FAILED) {
						s3 = null;
					}
					s1 = [s1, s2, s3];
					s0 = s1;
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e42); }
			}

			return s0;
		}

		function peg_parseHexDigit() {
			let s0, s1;

			peg_silentFails++;
			if (peg_r12.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e51); }
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e50); }
			}

			return s0;
		}

		function peg_parseDigit() {
			let s0, s1;

			peg_silentFails++;
			if (peg_r13.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e53); }
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e52); }
			}

			return s0;
		}

		function peg_parseIden() {
			let s0, s1, s2, s3, s4;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_currPos;
			if (peg_r14.test(input.charAt(peg_currPos))) {
				s2 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e55); }
			}
			if (s2 !== peg_FAILED) {
				s3 = [];
				if (peg_r15.test(input.charAt(peg_currPos))) {
					s4 = input.charAt(peg_currPos);
					peg_currPos++;
				} else {
					s4 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_e56); }
				}
				while (s4 !== peg_FAILED) {
					s3.push(s4);
					if (peg_r15.test(input.charAt(peg_currPos))) {
						s4 = input.charAt(peg_currPos);
						peg_currPos++;
					} else {
						s4 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_e56); }
					}
				}
				s2 = [s2, s3];
				s1 = s2;
			} else {
				peg_currPos = s1;
				s1 = peg_FAILED;
			}
			if (s1 !== peg_FAILED) {
				s0 = input.substring(s0, peg_currPos);
			} else {
				s0 = s1;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e54); }
			}

			return s0;
		}

		function peg_parseCOMMA() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (input.charCodeAt(peg_currPos) === 44) {
				s2 = peg_c29;
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e57); }
			}
			if (s2 !== peg_FAILED) {
				s3 = peg_parse_();
				s1 = [s1, s2, s3];
				s0 = s1;
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseCOLON() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (input.charCodeAt(peg_currPos) === 58) {
				s2 = peg_c30;
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e58); }
			}
			if (s2 !== peg_FAILED) {
				s3 = peg_parse_();
				s1 = [s1, s2, s3];
				s0 = s1;
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseOSB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (input.charCodeAt(peg_currPos) === 91) {
				s2 = peg_c31;
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e59); }
			}
			if (s2 !== peg_FAILED) {
				s3 = peg_parse_();
				s1 = [s1, s2, s3];
				s0 = s1;
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseCSB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (input.charCodeAt(peg_currPos) === 93) {
				s2 = peg_c32;
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e60); }
			}
			if (s2 !== peg_FAILED) {
				s3 = peg_parse_();
				s1 = [s1, s2, s3];
				s0 = s1;
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseOCB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (input.charCodeAt(peg_currPos) === 123) {
				s2 = peg_c33;
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e61); }
			}
			if (s2 !== peg_FAILED) {
				s3 = peg_parse_();
				s1 = [s1, s2, s3];
				s0 = s1;
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseCCB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (input.charCodeAt(peg_currPos) === 125) {
				s2 = peg_c34;
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e62); }
			}
			if (s2 !== peg_FAILED) {
				s3 = peg_parse_();
				s1 = [s1, s2, s3];
				s0 = s1;
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseOB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (input.charCodeAt(peg_currPos) === 40) {
				s2 = peg_c35;
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e63); }
			}
			if (s2 !== peg_FAILED) {
				s3 = peg_parse_();
				s1 = [s1, s2, s3];
				s0 = s1;
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseCB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (input.charCodeAt(peg_currPos) === 41) {
				s2 = peg_c36;
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_e64); }
			}
			if (s2 !== peg_FAILED) {
				s3 = peg_parse_();
				s1 = [s1, s2, s3];
				s0 = s1;
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		peg_result = peg_startRuleFunction();

		if (peg_result !== peg_FAILED && peg_currPos === input.length) {
			return peg_result;
		} else {
			if (peg_result !== peg_FAILED && peg_currPos < input.length) {
				peg_fail(peg_endExpectation());
			}

			throw peg_buildStructuredError(
				peg_maxFailExpected,
				peg_maxFailPos < input.length ? input.charAt(peg_maxFailPos) : null,
				peg_maxFailPos < input.length
					? peg_computeLocation(peg_maxFailPos, peg_maxFailPos + 1)
					: peg_computeLocation(peg_maxFailPos, peg_maxFailPos)
			);
		}
	}

	return {
		SyntaxError: peg_SyntaxError,
		parse: peg_parse
	};
})();