<script lang="ts">
  import type { PostWithImages } from '$lib/utils/prismaTypes';

  import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
  import { Color } from '@tiptap/extension-color';
  import { Link } from '@tiptap/extension-link';
  import ListItem from '@tiptap/extension-list-item';
  import TextAlign from '@tiptap/extension-text-align';
  import TextStyle from '@tiptap/extension-text-style';
  import Underline from '@tiptap/extension-underline';
  import StarterKit from '@tiptap/starter-kit';
  import clsx from 'clsx';
  import bash from 'highlight.js/lib/languages/bash';
  import css from 'highlight.js/lib/languages/css';
  import java from 'highlight.js/lib/languages/java';
  import js from 'highlight.js/lib/languages/javascript';
  import python from 'highlight.js/lib/languages/python';
  import shell from 'highlight.js/lib/languages/shell';
  import sql from 'highlight.js/lib/languages/sql';
  import ts from 'highlight.js/lib/languages/typescript';
  import html from 'highlight.js/lib/languages/xml';
  import { createLowlight } from 'lowlight';
  import { map } from 'remeda';
  import type { Readable, Writable } from 'svelte/store';
  import { Tooltip } from 'svelte-5-ui-lib';
  import {
    Bars3,
    Bars3BottomLeft,
    Bars3BottomRight,
    Bars3CenterLeft,
    Bold,
    BookOpen,
    CodeBracket,
    CommandLine,
    DocumentText,
    H1,
    H2,
    H3,
    Icon,
    Italic,
    ListBullet,
    Minus,
    NumberedList,
    Strikethrough,
    Underline as UnderlineIcon,
  } from 'svelte-hero-icons';
  import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
  import ImageResize from 'tiptap-extension-resize-image';

  const lowlight = createLowlight();
  lowlight.register('html', html);
  lowlight.register('css', css);
  lowlight.register('js', js);
  lowlight.register('ts', ts);
  lowlight.register('python', python);
  lowlight.register('java', java);
  lowlight.register('sql', sql);
  lowlight.register('bash', bash);
  lowlight.register('shell', shell);

  let {
    postData,
    editorContent = $bindable(),
    filePreviews: parentFilePreviews,
  }: {
    postData: PostWithImages | undefined;
    editorContent: Writable<string | undefined>;
    filePreviews: Writable<FilePreview[]>;
  } = $props();

  let editor = $state() as Readable<Editor>;
  let lastProcessedUrls: string[] = $state([]);

  const buttonGroups = $state([
    {
      groupName: '헤딩',
      buttons: [
        {
          name: '제목1',
          icon: H1,
          action: () => $editor?.chain().focus().toggleHeading({ level: 1 }).run(),
          check: () => $editor?.isActive('heading', { level: 1 }),
        },
        {
          name: '제목2',
          icon: H2,
          action: () => $editor?.chain().focus().toggleHeading({ level: 2 }).run(),
          check: () => $editor?.isActive('heading', { level: 2 }),
        },
        {
          name: '제목3',
          icon: H3,
          action: () => $editor?.chain().focus().toggleHeading({ level: 3 }).run(),
          check: () => $editor?.isActive('heading', { level: 3 }),
        },
        {
          name: '본문',
          icon: DocumentText,
          action: () => $editor?.chain().focus().setParagraph().run(),
          check: () => $editor?.isActive('paragraph'),
        },
      ],
    },
    {
      groupName: '스타일',
      buttons: [
        {
          name: '굵게',
          icon: Bold,
          action: () => $editor?.chain().focus().toggleBold().run(),
          check: () => $editor?.isActive('bold'),
        },
        {
          name: '기울임꼴',
          icon: Italic,
          action: () => $editor?.chain().focus().toggleItalic().run(),
          check: () => $editor?.isActive('italic'),
        },
        {
          name: '밑줄',
          icon: UnderlineIcon,
          action: () => $editor?.chain().focus().toggleUnderline().run(),
          check: () => $editor?.isActive('underline'),
        },
        {
          name: '취소선',
          icon: Strikethrough,
          action: () => $editor?.chain().focus().toggleStrike().run(),
          check: () => $editor?.isActive('strike'),
        },
      ],
    },
    {
      groupName: '정렬',
      buttons: [
        {
          name: '왼쪽정렬',
          icon: Bars3BottomLeft,
          action: () => $editor.chain().focus().setTextAlign('left').run(),
          check: () => $editor?.isActive({ textAlign: 'left' }),
        },
        {
          name: '가운데정렬',
          icon: Bars3CenterLeft,
          action: () => $editor.chain().focus().setTextAlign('center').run(),
          check: () => $editor?.isActive({ textAlign: 'center' }),
        },
        {
          name: '오른쪽정렬',
          icon: Bars3BottomRight,
          action: () => $editor.chain().focus().setTextAlign('right').run(),
          check: () => $editor?.isActive({ textAlign: 'right' }),
        },
        {
          name: '양쪽정렬',
          icon: Bars3,
          action: () => $editor.chain().focus().setTextAlign('justify').run(),
          check: () => $editor?.isActive({ textAlign: 'justify' }),
        },
      ],
    },

    {
      groupName: '기타',
      buttons: [
        {
          name: '코드',
          icon: CodeBracket,
          action: () => $editor?.chain().focus().toggleCode().run(),
          check: () => $editor?.isActive('code'),
        },
        {
          name: '코드블록',
          icon: CommandLine,
          action: () => $editor?.chain().focus().toggleCodeBlock().run(),
          check: () => $editor?.isActive('codeBlock'),
        },
        {
          name: '불릿리스트',
          icon: ListBullet,
          action: () => $editor?.chain().focus().toggleBulletList().run(),
          check: () => $editor?.isActive('bulletList'),
        },
        {
          name: '번호리스트',
          icon: NumberedList,
          action: () => $editor?.chain().focus().toggleOrderedList().run(),
          check: () => $editor?.isActive('orderedList'),
        },
        {
          name: '인용문',
          icon: BookOpen,
          action: () => $editor?.chain().focus().toggleBlockquote().run(),
          check: () => $editor?.isActive('blockquote'),
        },
        {
          name: '수평선',
          icon: Minus,
          action: () => $editor?.chain().focus().setHorizontalRule().run(),
          check: null,
        },
      ],
    },
  ]);

  const addImagesAsBlock = async (urls: string[]) => {
    if (urls.length > 0) {
      const imageHTML = map(urls, (url) => `<img src="${url}" alt="">`).join(' ');

      $editor.chain().focus().insertContent(imageHTML).run();
    }
  };

  $effect(() => {
    editor = createEditor({
      extensions: [
        StarterKit.configure({
          codeBlock: false,
        }),
        Underline,
        Color.configure({ types: [TextStyle.name, ListItem.name] }),
        TextStyle.configure({ HTMLAttributes: [ListItem.name] }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        CodeBlockLowlight.configure({
          lowlight,
        }),
        ImageResize,
        Link.configure({
          openOnClick: true,
          autolink: true,
          defaultProtocol: 'https',
          protocols: ['http', 'https'],
          isAllowedUri: (url, ctx) => {
            try {
              // URL 생성
              const parsedUrl = url.includes(':')
                ? new URL(url)
                : new URL(`${ctx.defaultProtocol}://${url}`);

              // 기본 유효성 검사 수행
              if (!ctx.defaultValidate(parsedUrl.href)) {
                return false;
              }

              // 허용되지 않은 프로토콜
              const disallowedProtocols = ['ftp', 'file', 'mailto'];
              const protocol = parsedUrl.protocol.replace(':', '');

              if (disallowedProtocols.includes(protocol)) {
                return false;
              }

              // ctx.protocols에 지정된 프로토콜만 허용
              const allowedProtocols = ctx.protocols.map((p) =>
                typeof p === 'string' ? p : p.scheme,
              );

              if (!allowedProtocols.includes(protocol)) {
                return false;
              }

              // 허용되지 않은 도메인
              const disallowedDomains = ['example-phishing.com', 'malicious-site.net'];
              const domain = parsedUrl.hostname;

              if (disallowedDomains.includes(domain)) {
                return false;
              }

              // 모든 검사를 통과했음
              return true;
            } catch (err) {
              console.error(err);
              return false;
            }
          },
          shouldAutoLink: (url) => {
            try {
              // URL 생성
              const parsedUrl = url.includes(':') ? new URL(url) : new URL(`https://${url}`);

              // 도메인이 허용되지 않은 목록에 없는 경우에만 자동 링크 생성
              const disallowedDomains = ['example-no-autolink.com', 'another-no-autolink.com'];
              const domain = parsedUrl.hostname;

              return !disallowedDomains.includes(domain);
            } catch (err) {
              console.error(err);
              return false;
            }
          },
        }),
      ],
      content: postData?.content,
      onUpdate: ({ editor }) => {
        editorContent.set(editor.getHTML());
      },
    });
  });

  $effect(() => {
    const urls = map($parentFilePreviews, ({ src }) => src);

    if (
      urls.length === lastProcessedUrls.length &&
      urls.every((url, index) => url === lastProcessedUrls[index])
    ) {
      return;
    }

    addImagesAsBlock(urls);
    lastProcessedUrls = urls;
  });
</script>

<div>
  {#if $editor}
    <div class="flex items-center space-x-4 space-y-1">
      {#each buttonGroups as group}
        <div class="flex flex-wrap gap-1">
          {#each group.buttons as btn}
            <div class="">
              <button
                type="button"
                id={btn.name}
                class={clsx(
                  'flex items-center justify-center rounded p-1',
                  btn.check && btn.check()
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black',
                )}
                onclick={() => btn.action && btn.action()}
                aria-label={btn.name}
              >
                <Icon src={btn.icon} size="20" />
              </button>

              <Tooltip class="text-xs" offset={6} triggeredBy={`#${btn.name}`} position="bottom"
                >{btn.name}</Tooltip
              >
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>

<div class="mt-5">
  <EditorContent
    class="prose prose-sm max-w-none dark:prose-invert xs:prose-base"
    editor={$editor}
  />
</div>
