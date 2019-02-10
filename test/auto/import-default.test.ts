import clipboard from '../../build/clipboard-polyfill';

test('confirm import star works', () => {
    var dt = new clipboard.DT();
    dt.setData("text/plain", "The answer is 42");
    clipboard.write(dt);

    expect(clipboard).toBeTruthy();
    expect(clipboard.read()).toMatchObject({});
    expect(typeof clipboard.write).toBe('function');
});