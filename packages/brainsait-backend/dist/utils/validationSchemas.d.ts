export declare const commonValidation: {
    id: any;
    email: any;
    password: any;
    name: (field: string) => any;
    pagination: any[];
    search: any;
};
export declare const authValidation: {
    register: any[];
    login: any[];
    verifyEmail: any[];
    forgotPassword: any[];
    resetPassword: any[];
    changePassword: any[];
    refreshToken: any[];
};
export declare const smeValidation: {
    create: any[];
    update: any[];
    list: any[];
    updateVerification: any[];
    uploadDocuments: any[];
};
export declare const programValidation: {
    create: any[];
    update: any[];
    list: any[];
    enroll: any[];
    updateEnrollmentStatus: any[];
    updateProgress: any[];
};
export declare const documentValidation: {
    feasibilityStudy: any[];
    businessPlan: any[];
    certificate: any[];
    fileName: any[];
};
export declare const analyticsValidation: {
    export: any[];
    dateRange: any[];
};
export declare const userValidation: {
    updateProfile: any[];
    list: any[];
    updateRole: any[];
    updateStatus: any[];
};
export declare const fileValidation: {
    single: any[];
    multiple: any[];
};
export declare const customValidation: {
    dateRange: (startField: string, endField: string) => any[];
    passwordConfirmation: any[];
    arrayLength: (field: string, min: number, max?: number) => any[];
    uniqueArray: (field: string) => any[];
    emailUnique: any[];
    fileValidation: any[];
};
export declare const validationSchemas: {
    auth: {
        register: any[];
        login: any[];
        verifyEmail: any[];
        forgotPassword: any[];
        resetPassword: any[];
        changePassword: any[];
        refreshToken: any[];
    };
    sme: {
        create: any[];
        update: any[];
        list: any[];
        updateVerification: any[];
        uploadDocuments: any[];
    };
    program: {
        create: any[];
        update: any[];
        list: any[];
        enroll: any[];
        updateEnrollmentStatus: any[];
        updateProgress: any[];
    };
    document: {
        feasibilityStudy: any[];
        businessPlan: any[];
        certificate: any[];
        fileName: any[];
    };
    analytics: {
        export: any[];
        dateRange: any[];
    };
    user: {
        updateProfile: any[];
        list: any[];
        updateRole: any[];
        updateStatus: any[];
    };
    file: {
        single: any[];
        multiple: any[];
    };
    common: {
        id: any;
        email: any;
        password: any;
        name: (field: string) => any;
        pagination: any[];
        search: any;
    };
    custom: {
        dateRange: (startField: string, endField: string) => any[];
        passwordConfirmation: any[];
        arrayLength: (field: string, min: number, max?: number) => any[];
        uniqueArray: (field: string) => any[];
        emailUnique: any[];
        fileValidation: any[];
    };
};
//# sourceMappingURL=validationSchemas.d.ts.map