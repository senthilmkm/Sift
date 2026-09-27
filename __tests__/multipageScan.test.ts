describe('Multi-Page Camera Carousel Batch Scan', () => {
  function prepareMultipagePayload(images: string[], maxLimit = 5) {
    if (images.length === 0) {
      throw new Error('No images provided for scan');
    }
    const limitedImages = images.slice(0, maxLimit);
    return {
      pageCount: limitedImages.length,
      parts: limitedImages.map((base64, index) => ({
        inlineData: { mimeType: 'image/png', data: base64 },
        pageNumber: index + 1
      }))
    };
  }

  it('constructs multi-page payload correctly for 3 captured pages', () => {
    const pages = ['page1_base64', 'page2_base64', 'page3_base64'];
    const payload = prepareMultipagePayload(pages);

    expect(payload.pageCount).toBe(3);
    expect(payload.parts.length).toBe(3);
    expect(payload.parts[0].pageNumber).toBe(1);
    expect(payload.parts[2].pageNumber).toBe(3);
  });

  it('enforces maximum 5 page limit for large document scans', () => {
    const pages = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
    const payload = prepareMultipagePayload(pages);

    expect(payload.pageCount).toBe(5);
    expect(payload.parts.length).toBe(5);
  });

  it('throws error when scanning empty page list', () => {
    expect(() => prepareMultipagePayload([])).toThrow('No images provided for scan');
  });
});
