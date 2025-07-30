const buildImageHTML = (escapedAlt: string, cleanSrc: string) => {
  return (`<img 
  src="${cleanSrc}" 
  alt="${escapedAlt}" 
  style="display: inline-block; width: 120px; height: 80px; object-fit: cover; border-radius: 6px; margin: 0.5rem; border: 1px solid #10b981; vertical-align: top; cursor: pointer; transition: transform 0.2s ease;" 
  onMouseOver="
    this.style.transform = 'scale(1.05)';
    
    if (!this.previewElement) {
      const preview = document.createElement('div');
      preview.style.cssText = 'position: fixed; z-index: 10000; pointer-events: none; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 2px solid #10b981; background: white; padding: 8px; opacity: 0; transition: opacity 0.2s ease;';
      
      const previewImg = document.createElement('img');
      previewImg.src = this.src;
      previewImg.alt = this.alt;
      previewImg.style.cssText = 'max-width: 80vw; max-height: 60vh; border-radius: 6px; display: block; object-fit: contain;';
      
      preview.appendChild(previewImg);
      document.body.appendChild(preview);
      this.previewElement = preview;
    }
    
    const preview = this.previewElement;
    preview.style.display = 'block';
    preview.style.opacity = '1';
    
    const updatePosition = (e) => {
      const rect = preview.getBoundingClientRect();
      let x = e.clientX + 20;
      let y = e.clientY - 100;
      
      if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 20;
      if (y < 0) y = e.clientY + 20;
      if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 20;
      
      preview.style.left = x + 'px';
      preview.style.top = y + 'px';
    };
    
    this.updatePosition = updatePosition;
    document.addEventListener('mousemove', updatePosition);
    updatePosition(event);
  "
  onMouseOut="
    this.style.transform = 'scale(1)';
    
    if (this.previewElement) {
      this.previewElement.style.opacity = '0';
      setTimeout(() => {
        if (this.previewElement) {
          this.previewElement.style.display = 'none';
        }
      }, 200);
    }
    
    if (this.updatePosition) {
      document.removeEventListener('mousemove', this.updatePosition);
      this.updatePosition = null;
    }
  "
/>`)
}

// Constantes para estilos CSS
const STYLES = {
  codeBlock: 'background: rgba(0, 0, 0, 0.8); color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 1rem 0; font-family: \'Fira Code\', monospace; border-left: 4px solid #10b981;',

  headings: {
    h1: 'font-size: 2rem; font-weight: 700; color: #ffffff; margin: 1.5rem 0 1rem 0; line-height: 1.2; border-bottom: 2px solid #10b981; padding-bottom: 0.5rem;',
    h2: 'font-size: 1.5rem; font-weight: 600; color: #f3f4f6; margin: 1.25rem 0 0.75rem 0; line-height: 1.3;',
    h3: 'font-size: 1.25rem; font-weight: 600; color: #e5e7eb; margin: 1rem 0 0.5rem 0; line-height: 1.4;',
    h4: 'font-size: 1.125rem; font-weight: 600; color: #d1d5db; margin: 0.75rem 0 0.5rem 0; line-height: 1.4;',
    h5: 'font-size: 1rem; font-weight: 600; color: #d1d5db; margin: 0.5rem 0 0.25rem 0; line-height: 1.5;'
  },

  blockquote: 'border-left: 4px solid #10b981; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #d1d5db; background: rgba(16, 185, 129, 0.1); padding: 0.75rem 1rem; border-radius: 0 8px 8px 0;',

  listItem: 'margin: 0.25rem 0; color: #ffffff;',

  text: {
    boldItalic: 'font-weight: 700; color: #ffffff;',
    italic: 'color: #10b981; font-style: italic;',
    bold: 'font-weight: 600; color: #ffffff;',
    strikethrough: 'text-decoration: line-through; color: #9ca3af;',
    code: 'background: rgba(16, 185, 129, 0.1); color: #059669; padding: 0.25rem 0.5rem; border-radius: 4px; font-family: \'Fira Code\', monospace; font-size: 0.9em; border: 1px solid rgba(16, 185, 129, 0.2);'
  },

  link: 'color: #10b981; text-decoration: none; border-bottom: 1px solid #10b981; font-weight: 500; transition: all 0.2s ease;',

  hr: 'border: none; border-top: 2px solid #e5e7eb; margin: 2rem 0; width: 100%;',

  paragraph: 'margin: 0.75rem 0; line-height: 1.6; color: #ffffff;',

  list: {
    ordered: 'counter-reset: list-counter; padding-left: 1.5rem; margin: 0.75rem 0;',
    unordered: 'list-style-type: disc; padding-left: 1.5rem; margin: 0.75rem 0;'
  }
} as const;

// Regex patterns
const PATTERNS = {
  columnElements: [
    /^\s*\*\[column[^\]]*\]\*\s*$/gim,
    /^\s*\([^)]*column[^)]*\)\s*$/gim
  ],

  image: /!\[([^\]]*)\]\(([^)]+)\)/gim,

  codeBlock: /```([\s\S]*?)```/gim,

  headings: {
    h1: /^# (.*$)/gim,
    h2: /^## (.*$)/gim,
    h3: /^### (.*$)/gim,
    h4: /^#### (.*$)/gim,
    h5: /^##### (.*$)/gim
  },

  toggleHeadings: {
    h1: /<summary><strong># ([^<]*)<\/strong><\/summary>/gim,
    h2: /<summary><strong>## ([^<]*)<\/strong><\/summary>/gim,
    h3: /<summary><strong>### ([^<]*)<\/strong><\/summary>/gim,
    h4: /<summary><strong>#### ([^<]*)<\/strong><\/summary>/gim,
    h5: /<summary><strong>##### ([^<]*)<\/strong><\/summary>/gim
  },

  blockquote: /^>\s*(.*)$/gim,

  lists: {
    unordered: /^\s*[\*\-\+]\s+(.*)$/gim,
    ordered: /^\s*\d+\.\s+(.*)$/gim
  },

  text: {
    boldItalic: /\*\*\*(.*?)\*\*\*/gim,
    bold: /\*\*(.*?)\*\*/gim,
    italic: /\*(.*?)\*/gim,
    strikethrough: /~~(.*?)~~/gim,
    code: /`(.*?)`/gim
  },

  link: /\[([^\]]+)\]\(([^)]+)\)/gim,

  hr: /^---$/gim,

  lineBreaks: {
    paragraphBreak: /\n\n/gim,
    lineBreak: /\n/gim,
    newParagraph: /^(.+)/gim
  },

  cleanup: {
    emptyParagraphs: /<p><\/p>/gim,
    headingParagraphs: [
      /<p>\s*(<h[1-6])/gim,
      /(<\/h[1-6]>)\s*<\/p>/gim
    ],
    blockquoteParagraphs: [
      /<p>\s*(<blockquote)/gim,
      /(<\/blockquote>)\s*<\/p>/gim
    ],
    hrParagraphs: [
      /<p>\s*(<hr)/gim,
      /(<\/hr>)\s*<\/p>/gim
    ]
  },

  listGrouping: /(<li[^>]*>[\s\S]*?<\/li>)/gim,
  listCombining: /<\/(ul|ol)>\s*<(ul|ol)[^>]*>/gim,
  imagePlaceholder: /<p>(___IMAGE_PLACEHOLDER_\d+___)<\/p>/gim
} as const;

interface ImageStore {
  [placeholder: string]: string;
}

const filterColumnElements = (content: string): string => {
  let result = content;
  PATTERNS.columnElements.forEach(pattern => {
    result = result.replace(pattern, '');
  });
  return result;
};

const protectImages = (content: string): { result: string; imageStore: ImageStore } => {
  const imageStore: ImageStore = {};
  let imageCounter = 0;

  const result = content.replace(PATTERNS.image, (match, alt, src) => {
    console.log('🖼️ [renderMarkdown] Imagen encontrada:', { alt, src });

    const cleanSrc = src.trim();
    const cleanAlt = alt.trim() || 'Imagen';
    const escapedAlt = cleanAlt.replace(/"/g, '&quot;');

    const placeholder = `___IMAGE_PLACEHOLDER_${imageCounter}___`;
    imageStore[placeholder] = buildImageHTML(escapedAlt, cleanSrc);
    imageCounter++;

    console.log('🏗️ [renderMarkdown] Imagen protegida con placeholder:', placeholder);
    return placeholder;
  });

  return { result, imageStore };
};

const processCodeBlocks = (content: string): string => {
  return content.replace(PATTERNS.codeBlock, `<pre style="${STYLES.codeBlock}"><code>$1</code></pre>`);
};

const processHeadings = (content: string): string => {
  let result = content;

  result = result.replace(PATTERNS.headings.h1, `<h1 style="${STYLES.headings.h1}">$1</h1>`);
  result = result.replace(PATTERNS.headings.h2, `<h2 style="${STYLES.headings.h2}">$1</h2>`);
  result = result.replace(PATTERNS.headings.h3, `<h3 style="${STYLES.headings.h3}">$1</h3>`);
  result = result.replace(PATTERNS.headings.h4, `<h4 style="${STYLES.headings.h4}">$1</h4>`);
  result = result.replace(PATTERNS.headings.h5, `<h5 style="${STYLES.headings.h5}">$1</h5>`);

  return result;
};

const processToggleHeadings = (content: string): string => {
  let result = content;

  result = result.replace(PATTERNS.toggleHeadings.h1, `<summary><strong><span style="${STYLES.headings.h1}">$1</span></strong></summary>`);
  result = result.replace(PATTERNS.toggleHeadings.h2, `<summary><strong><span style="${STYLES.headings.h2}">$1</span></strong></summary>`);
  result = result.replace(PATTERNS.toggleHeadings.h3, `<summary><strong><span style="${STYLES.headings.h3}">$1</span></strong></summary>`);
  result = result.replace(PATTERNS.toggleHeadings.h4, `<summary><strong><span style="${STYLES.headings.h4}">$1</span></strong></summary>`);
  result = result.replace(PATTERNS.toggleHeadings.h5, `<summary><strong><span style="${STYLES.headings.h5}">$1</span></strong></summary>`);

  return result;
};

const processQuotes = (content: string): string => {
  return content.replace(PATTERNS.blockquote, `<blockquote style="${STYLES.blockquote}">$1</blockquote>`);
};

const processLists = (content: string): string => {
  let result = content;

  result = result.replace(PATTERNS.lists.unordered, `<li style="${STYLES.listItem}">$1</li>`);
  result = result.replace(PATTERNS.lists.ordered, `<li style="${STYLES.listItem}">$1</li>`);

  return result;
};

const processTextFormatting = (content: string): string => {
  let result = content;

  result = result.replace(PATTERNS.text.boldItalic, `<strong style="${STYLES.text.boldItalic}"><em style="${STYLES.text.italic}">$1</em></strong>`);
  result = result.replace(PATTERNS.text.bold, `<strong style="${STYLES.text.bold}">$1</strong>`);
  result = result.replace(PATTERNS.text.italic, `<em style="${STYLES.text.italic}">$1</em>`);
  result = result.replace(PATTERNS.text.strikethrough, `<del style="${STYLES.text.strikethrough}">$1</del>`);
  result = result.replace(PATTERNS.text.code, `<code style="${STYLES.text.code}">$1</code>`);

  return result;
};

const processLinks = (content: string): string => {
  return content.replace(
    PATTERNS.link,
    `<a href="$2" target="_blank" rel="noopener noreferrer" style="${STYLES.link}" onMouseOver="this.style.backgroundColor='rgba(16, 185, 129, 0.1)'; this.style.borderBottomWidth='2px';" onMouseOut="this.style.backgroundColor='transparent'; this.style.borderBottomWidth='1px';">$1</a>`
  );
};

const processHorizontalRules = (content: string): string => {
  return content.replace(PATTERNS.hr, `<hr style="${STYLES.hr}">`);
};

const processParagraphs = (content: string): string => {
  let result = content;

  result = result.replace(PATTERNS.lineBreaks.paragraphBreak, '</p><p>');
  result = result.replace(PATTERNS.lineBreaks.lineBreak, '<br>');
  result = result.replace(PATTERNS.lineBreaks.newParagraph, '<p>$1</p>');
  result = result.replace(PATTERNS.cleanup.emptyParagraphs, '');

  return result;
};

const cleanupParagraphs = (content: string): string => {
  let result = content;

  PATTERNS.cleanup.headingParagraphs.forEach(pattern => {
    result = result.replace(pattern, '$1');
  });

  PATTERNS.cleanup.blockquoteParagraphs.forEach(pattern => {
    result = result.replace(pattern, '$1');
  });

  PATTERNS.cleanup.hrParagraphs.forEach(pattern => {
    result = result.replace(pattern, '$1');
  });

  return result;
};

const processListGrouping = (content: string): string => {
  let result = content.replace(PATTERNS.listGrouping, (match) => {
    const hasNumbers = /^\s*\d+\./.test(match);
    const listType = hasNumbers ? 'ol' : 'ul';
    const listStyle = hasNumbers ? STYLES.list.ordered : STYLES.list.unordered;
    return `<${listType} style="${listStyle}">${match}</${listType}>`;
  });

  result = result.replace(PATTERNS.listCombining, '');
  result = result.replace(/<p>/gim, `<p style="${STYLES.paragraph}">`);

  return result;
};

const restoreImages = (content: string, imageStore: ImageStore): string => {
  let result = content.replace(PATTERNS.imagePlaceholder, '$1');

  Object.keys(imageStore).forEach(placeholder => {
    result = result.replace(placeholder, imageStore[placeholder]);
  });

  return result;
};

export const renderMarkdown = (content: string): string => {
  console.log('🔍 [renderMarkdown] Input:', content.substring(0, 200));

  let result = content;

  result = filterColumnElements(result);

  const { result: contentWithProtectedImages, imageStore } = protectImages(result);
  result = contentWithProtectedImages;

  result = processCodeBlocks(result);
  result = processHeadings(result);
  result = processToggleHeadings(result);
  result = processQuotes(result);
  result = processLists(result);
  result = processTextFormatting(result);
  result = processLinks(result);
  result = processHorizontalRules(result);
  result = processParagraphs(result);
  result = cleanupParagraphs(result);
  result = processListGrouping(result);

  result = restoreImages(result, imageStore);

  console.log('✅ [renderMarkdown] Output:', result.substring(0, 200));
  return result;
};