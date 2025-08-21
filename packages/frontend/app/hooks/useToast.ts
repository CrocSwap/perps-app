interface useToastIF {
    create: () => null;
}

export function useToast(): useToastIF {
    function createToast() {
        return null;
    }

    return {
        create: createToast,
    };
}
