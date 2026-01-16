import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from 'react';

interface KeyboardShortcutsContextValue {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

const KeyboardShortcutsContext =
    createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcuts() {
    const context = useContext(KeyboardShortcutsContext);
    if (!context) {
        throw new Error(
            'useKeyboardShortcuts must be used within KeyboardShortcutsProvider',
        );
    }
    return context;
}

interface KeyboardShortcutsProviderProps {
    children: ReactNode;
}

export function KeyboardShortcutsProvider({
    children,
}: KeyboardShortcutsProviderProps) {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

    return (
        <KeyboardShortcutsContext.Provider
            value={{ isOpen, open, close, toggle }}
        >
            {children}
        </KeyboardShortcutsContext.Provider>
    );
}
