export declare const commonValidation: {
    id: import("express-validator").ValidationChain;
    email: import("express-validator").ValidationChain;
    password: import("express-validator").ValidationChain;
    name: (field: string) => import("express-validator").ValidationChain;
    pagination: import("express-validator").ValidationChain[];
    search: import("express-validator").ValidationChain;
};
export declare const authValidation: {
    register: import("express-validator").ValidationChain[];
    login: import("express-validator").ValidationChain[];
    verifyEmail: import("express-validator").ValidationChain[];
    forgotPassword: import("express-validator").ValidationChain[];
    resetPassword: import("express-validator").ValidationChain[];
    changePassword: import("express-validator").ValidationChain[];
    refreshToken: import("express-validator").ValidationChain[];
};
export declare const smeValidation: {
    create: import("express-validator").ValidationChain[];
    update: import("express-validator").ValidationChain[];
    list: import("express-validator").ValidationChain[];
    updateVerification: import("express-validator").ValidationChain[];
    uploadDocuments: import("express-validator").ValidationChain[];
};
export declare const programValidation: {
    create: import("express-validator").ValidationChain[];
    update: import("express-validator").ValidationChain[];
    list: import("express-validator").ValidationChain[];
    enroll: import("express-validator").ValidationChain[];
    updateEnrollmentStatus: import("express-validator").ValidationChain[];
    updateProgress: import("express-validator").ValidationChain[];
};
export declare const documentValidation: {
    feasibilityStudy: import("express-validator").ValidationChain[];
    businessPlan: import("express-validator").ValidationChain[];
    certificate: import("express-validator").ValidationChain[];
    fileName: import("express-validator").ValidationChain[];
};
export declare const analyticsValidation: {
    export: import("express-validator").ValidationChain[];
    dateRange: import("express-validator").ValidationChain[];
};
export declare const userValidation: {
    updateProfile: import("express-validator").ValidationChain[];
    list: import("express-validator").ValidationChain[];
    updateRole: import("express-validator").ValidationChain[];
    updateStatus: import("express-validator").ValidationChain[];
};
export declare const fileValidation: {
    single: import("express-validator").ValidationChain[];
    multiple: import("express-validator").ValidationChain[];
};
export declare const customValidation: {
    dateRange: (startField: string, endField: string) => import("express-validator").ValidationChain[];
    passwordConfirmation: import("express-validator").ValidationChain[];
    arrayLength: (field: string, min: number, max?: number) => import("express-validator").ValidationChain[];
    uniqueArray: (field: string) => import("express-validator").ValidationChain[];
    emailUnique: import("express-validator").ValidationChain[];
    fileValidation: import("express-validator").ValidationChain[];
};
export declare const validationSchemas: {
    auth: {
        register: import("express-validator").ValidationChain[];
        login: import("express-validator").ValidationChain[];
        verifyEmail: import("express-validator").ValidationChain[];
        forgotPassword: import("express-validator").ValidationChain[];
        resetPassword: import("express-validator").ValidationChain[];
        changePassword: import("express-validator").ValidationChain[];
        refreshToken: import("express-validator").ValidationChain[];
    };
    sme: {
        create: import("express-validator").ValidationChain[];
        update: import("express-validator").ValidationChain[];
        list: import("express-validator").ValidationChain[];
        updateVerification: import("express-validator").ValidationChain[];
        uploadDocuments: import("express-validator").ValidationChain[];
    };
    program: {
        create: import("express-validator").ValidationChain[];
        update: import("express-validator").ValidationChain[];
        list: import("express-validator").ValidationChain[];
        enroll: import("express-validator").ValidationChain[];
        updateEnrollmentStatus: import("express-validator").ValidationChain[];
        updateProgress: import("express-validator").ValidationChain[];
    };
    document: {
        feasibilityStudy: import("express-validator").ValidationChain[];
        businessPlan: import("express-validator").ValidationChain[];
        certificate: import("express-validator").ValidationChain[];
        fileName: import("express-validator").ValidationChain[];
    };
    analytics: {
        export: import("express-validator").ValidationChain[];
        dateRange: import("express-validator").ValidationChain[];
    };
    user: {
        updateProfile: import("express-validator").ValidationChain[];
        list: import("express-validator").ValidationChain[];
        updateRole: import("express-validator").ValidationChain[];
        updateStatus: import("express-validator").ValidationChain[];
    };
    file: {
        single: import("express-validator").ValidationChain[];
        multiple: import("express-validator").ValidationChain[];
    };
    common: {
        id: import("express-validator").ValidationChain;
        email: import("express-validator").ValidationChain;
        password: import("express-validator").ValidationChain;
        name: (field: string) => import("express-validator").ValidationChain;
        pagination: import("express-validator").ValidationChain[];
        search: import("express-validator").ValidationChain;
    };
    custom: {
        dateRange: (startField: string, endField: string) => import("express-validator").ValidationChain[];
        passwordConfirmation: import("express-validator").ValidationChain[];
        arrayLength: (field: string, min: number, max?: number) => import("express-validator").ValidationChain[];
        uniqueArray: (field: string) => import("express-validator").ValidationChain[];
        emailUnique: import("express-validator").ValidationChain[];
        fileValidation: import("express-validator").ValidationChain[];
    };
};
//# sourceMappingURL=validationSchemas.d.ts.map