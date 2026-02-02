export class SlugUtil {
  static generate(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static generateUnique(text: string, suffix?: string | number): string {
    const slug = this.generate(text);
    return suffix ? `${slug}-${suffix}` : slug;
  }
}
