"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationStatus = exports.IndustryFocus = exports.SMEType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SME_OWNER"] = "SME_OWNER";
    UserRole["MENTOR"] = "MENTOR";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var SMEType;
(function (SMEType) {
    SMEType["STARTUP"] = "STARTUP";
    SMEType["SMALL_BUSINESS"] = "SMALL_BUSINESS";
    SMEType["MEDIUM_ENTERPRISE"] = "MEDIUM_ENTERPRISE";
    SMEType["NON_PROFIT"] = "NON_PROFIT";
})(SMEType || (exports.SMEType = SMEType = {}));
var IndustryFocus;
(function (IndustryFocus) {
    IndustryFocus["HEALTHCARE_TECHNOLOGY"] = "HEALTHCARE_TECHNOLOGY";
    IndustryFocus["MEDICAL_DEVICES"] = "MEDICAL_DEVICES";
    IndustryFocus["PHARMACEUTICALS"] = "PHARMACEUTICALS";
    IndustryFocus["BIOTECHNOLOGY"] = "BIOTECHNOLOGY";
    IndustryFocus["DIGITAL_HEALTH"] = "DIGITAL_HEALTH";
    IndustryFocus["TELEMEDICINE"] = "TELEMEDICINE";
    IndustryFocus["HEALTH_ANALYTICS"] = "HEALTH_ANALYTICS";
    IndustryFocus["MEDICAL_RESEARCH"] = "MEDICAL_RESEARCH";
    IndustryFocus["HEALTHCARE_SERVICES"] = "HEALTHCARE_SERVICES";
    IndustryFocus["HEALTH_INSURANCE"] = "HEALTH_INSURANCE";
})(IndustryFocus || (exports.IndustryFocus = IndustryFocus = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["IN_REVIEW"] = "IN_REVIEW";
    VerificationStatus["VERIFIED"] = "VERIFIED";
    VerificationStatus["REJECTED"] = "REJECTED";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
//# sourceMappingURL=user.types.js.map