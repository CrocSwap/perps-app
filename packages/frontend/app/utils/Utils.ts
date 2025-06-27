export const formatAddress = (address: string) => {
    if (!address) return '';
    return address.slice(0, 6) + '...' + address.slice(-4);
};

export const getElementHeightWithMargins = (element: HTMLElement) => {
    if (!element) return 0;
    if (element.getBoundingClientRect().height <= 0) return 0;

    let ret = element.getBoundingClientRect().height;

    const mTop = getComputedStyle(element).marginTop;
    if (mTop) ret += parseFloat(mTop);

    const mBottom = getComputedStyle(element).marginBottom;
    if (mBottom) ret += parseFloat(mBottom);

    return ret;
};
