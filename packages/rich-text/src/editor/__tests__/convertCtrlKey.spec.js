import convertCtrlKey from '../convertCtrlKey';

describe('convertCtrlKey', () => {
    it('does not trigger callback if no ctrl key', () => {
        const cb = jest.fn();
        const e = { key: 'j' };

        convertCtrlKey(e, cb);

        expect(cb).not.toHaveBeenCalled();
    });

    it('triggers callback with opening marker if ctrl key + "b"', () => {
        const cb = jest.fn();
        const e = {
            key: 'b',
            ctrlKey: true,
            target: {
                selectionStart: 0,
                selectionEnd: 0,
                value: '',
            },
        };

        convertCtrlKey(e, cb);

        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith('*');
    });

    it('triggers callback with closing marker if ctrl key + "b" + value', () => {
        const cb = jest.fn();
        const e = {
            key: 'b',
            metaKey: true,
            target: {
                selectionStart: 4,
                selectionEnd: 4,
                value: '*abc',
            },
        };

        convertCtrlKey(e, cb);

        expect(cb).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith('*abc*');
    });
});