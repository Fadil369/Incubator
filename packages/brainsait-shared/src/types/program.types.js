"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStatus = exports.MentorshipStatus = exports.EnrollmentStatus = exports.ProgramStatus = exports.ProgramType = void 0;
var ProgramType;
(function (ProgramType) {
    ProgramType["INCUBATION"] = "INCUBATION";
    ProgramType["ACCELERATION"] = "ACCELERATION";
    ProgramType["MENTORSHIP"] = "MENTORSHIP";
    ProgramType["WORKSHOP"] = "WORKSHOP";
    ProgramType["MASTERCLASS"] = "MASTERCLASS";
})(ProgramType || (exports.ProgramType = ProgramType = {}));
var ProgramStatus;
(function (ProgramStatus) {
    ProgramStatus["DRAFT"] = "DRAFT";
    ProgramStatus["PUBLISHED"] = "PUBLISHED";
    ProgramStatus["ACTIVE"] = "ACTIVE";
    ProgramStatus["COMPLETED"] = "COMPLETED";
    ProgramStatus["CANCELLED"] = "CANCELLED";
})(ProgramStatus || (exports.ProgramStatus = ProgramStatus = {}));
var EnrollmentStatus;
(function (EnrollmentStatus) {
    EnrollmentStatus["PENDING"] = "PENDING";
    EnrollmentStatus["APPROVED"] = "APPROVED";
    EnrollmentStatus["ACTIVE"] = "ACTIVE";
    EnrollmentStatus["COMPLETED"] = "COMPLETED";
    EnrollmentStatus["WITHDRAWN"] = "WITHDRAWN";
    EnrollmentStatus["REJECTED"] = "REJECTED";
})(EnrollmentStatus || (exports.EnrollmentStatus = EnrollmentStatus = {}));
var MentorshipStatus;
(function (MentorshipStatus) {
    MentorshipStatus["PENDING"] = "PENDING";
    MentorshipStatus["ACTIVE"] = "ACTIVE";
    MentorshipStatus["COMPLETED"] = "COMPLETED";
    MentorshipStatus["CANCELLED"] = "CANCELLED";
})(MentorshipStatus || (exports.MentorshipStatus = MentorshipStatus = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["SCHEDULED"] = "SCHEDULED";
    SessionStatus["IN_PROGRESS"] = "IN_PROGRESS";
    SessionStatus["COMPLETED"] = "COMPLETED";
    SessionStatus["CANCELLED"] = "CANCELLED";
    SessionStatus["NO_SHOW"] = "NO_SHOW";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
//# sourceMappingURL=program.types.js.map