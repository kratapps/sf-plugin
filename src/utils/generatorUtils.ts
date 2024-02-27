export function hasModifier(modifiers: string[] | null, modifier: string): boolean {
    return modifiers != null && modifiers.includes(modifier);
}

export function hasTestMethodModifier(modifiers: string[] | null): boolean {
    return hasModifier(modifiers, 'testMethod');
}

export function getAccessModifier(modifiers: string[] | null): 'private' | 'protected' | 'public' | 'global' | null {
    if (hasModifier(modifiers, 'private')) {
        return 'private';
    } else if (hasModifier(modifiers, 'protected')) {
        return 'protected';
    } else if (hasModifier(modifiers, 'public')) {
        return 'public';
    } else if (hasModifier(modifiers, 'global')) {
        return 'global';
    }
    return null;
}
