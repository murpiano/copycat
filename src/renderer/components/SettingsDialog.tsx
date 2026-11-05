import {
  useEffect,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import type { AppSettings, ClearHistoryInput, ClearHistoryScope } from '../../shared/types';
import { DEFAULT_FILE_SECTION_ORDER, type FileGroup } from '../../shared/file-kind';
import { CloseIcon } from './icons';
import { Overlay } from './Overlay';
import { useT } from '../i18n';

const MURPIANO_URL = 'https://github.com/murpiano';

function MurpianoSignature() {
  function open(event: ReactMouseEvent) {
    event.preventDefault();
    void window.copycat.openExternal(MURPIANO_URL);
  }
  return (
    <a
      className="mp-signature"
      href={MURPIANO_URL}
      onClick={open}
      aria-label="Authored by murpiano — GitHub profile"
    >
      <span className="mp-signature__label">
        Authored by <strong>murpiano</strong>
      </span>
      <svg
        className="mp-signature__mark"
        viewBox="0 0 240 275"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <g className="mp-cat--idle" fill="currentColor" fillRule="evenodd">
          <path d="M22.3,274.3 C21.8,273.8 21.6,272.7 21.6,270.3 C21.6,267.9 21.9,266.9 23.0,264.4 C24.8,260.3 29.2,256.1 33.7,253.8 C35.8,252.8 37.7,252.2 39.7,251.8 C40.9,251.6 41.2,251.5 41.8,250.8 C43.2,249.3 44.6,245.1 45.5,239.7 C46.1,236.3 46.3,227.1 45.9,223.0 C44.6,208.0 39.5,194.7 28.6,177.8 C27.9,176.8 25.8,173.5 23.8,170.5 C21.8,167.4 19.6,163.9 18.9,162.7 C16.2,158.2 11.7,150.2 10.4,147.4 C10.0,146.6 9.1,144.8 8.5,143.4 C5.3,136.7 2.5,128.0 1.4,120.8 C0.5,115.7 0.4,113.0 0.5,106.9 C0.5,102.2 0.6,100.6 1.1,97.5 C3.6,80.3 8.0,65.1 15.4,47.9 C17.1,43.9 20.7,36.5 22.5,33.2 C24.5,29.5 27.1,25.0 28.7,22.5 C32.9,15.7 40.4,5.3 43.5,1.9 C44.3,1.1 44.9,0.3 44.9,0.2 C44.9,0.1 45.0,0.0 45.1,0.0 C45.2,0.0 45.3,0.2 45.3,0.4 C45.3,0.6 45.9,2.4 46.5,4.3 C48.0,8.5 50.7,16.9 51.8,20.9 L52.5,23.7 L54.3,23.8 C66.8,24.8 73.5,27.0 79.9,32.2 C83.2,34.9 84.9,37.3 86.8,42.2 C88.7,47.2 91.0,49.8 95.8,52.2 C98.2,53.4 99.1,54.2 100.1,56.2 C101.3,58.8 101.3,60.8 100.1,63.9 C97.7,70.0 92.7,73.8 84.6,75.9 C79.5,77.1 77.4,78.0 75.2,79.6 C72.1,82.0 70.5,86.2 71.1,90.4 C72.3,98.4 77.7,104.7 87.3,109.3 C93.7,112.4 100.4,113.9 115.2,115.8 C124.8,117.0 130.7,117.9 136.8,119.2 C150.6,122.1 163.7,127.9 174.1,135.6 C180.3,140.3 188.0,148.1 192.4,154.3 C200.6,165.7 205.5,179.2 207.0,195.0 C207.4,198.9 207.4,209.5 206.9,212.8 C206.8,214.3 206.6,215.5 206.7,215.6 C206.8,215.7 208.6,212.3 209.6,210.1 C210.8,207.4 212.6,202.0 213.2,199.3 C216.4,186.0 214.6,171.2 208.3,159.4 C205.5,153.9 202.5,149.7 197.2,143.2 C194.6,140.1 186.1,131.8 180.7,127.1 C161.3,110.2 156.1,105.2 149.6,96.6 C143.0,88.1 138.4,78.9 135.9,69.2 C134.3,63.0 133.6,56.1 134.0,50.8 C134.5,45.2 135.5,41.3 137.9,36.3 C140.2,31.7 142.9,28.0 146.7,24.3 C153.6,17.7 161.6,13.8 170.8,12.6 C184.1,10.9 198.5,16.9 206.6,27.7 C209.2,31.2 211.1,34.5 212.6,38.2 C215.8,46.3 216.4,55.4 214.1,63.8 C212.2,70.5 209.0,75.6 203.2,80.8 C197.5,86.0 191.0,89.4 183.9,90.9 C181.3,91.5 176.5,91.7 173.2,91.3 C171.8,91.2 170.6,91.1 170.6,91.2 C170.4,91.4 175.2,96.5 178.0,99.3 C181.7,102.7 184.5,105.1 189.8,109.3 C204.0,120.6 206.2,122.5 211.8,128.1 C217.3,133.5 220.7,137.6 224.8,143.7 C232.6,155.4 237.3,167.7 239.3,182.0 C239.8,185.6 239.8,199.0 239.3,203.8 C238.2,214.3 235.6,224.3 232.1,232.1 C225.8,245.8 215.5,258.3 204.1,265.9 C199.1,269.2 192.0,272.3 186.2,273.5 C182.9,274.2 178.0,274.3 153.3,274.4 C142.7,274.4 116.7,274.4 95.7,274.5 L57.5,274.6 L58.5,273.9 C63.5,270.1 67.2,265.0 69.8,258.4 C73.3,249.3 74.3,239.6 73.4,223.0 C72.9,214.5 72.8,205.6 73.2,202.3 C73.7,197.5 75.2,190.7 76.8,186.6 C77.7,184.1 80.0,179.3 81.1,177.6 C83.9,173.0 84.9,171.7 87.3,169.0 C90.6,165.4 94.5,162.1 98.3,159.6 C106.2,154.5 112.7,151.9 120.9,150.5 C125.6,149.7 127.2,149.6 132.4,149.6 C140.8,149.6 144.4,150.3 154.1,153.8 C155.1,154.1 155.9,154.3 155.9,154.3 C156.0,154.2 153.8,152.6 152.3,151.7 C150.4,150.6 146.7,149.1 144.2,148.3 C131.3,144.3 117.6,144.8 105.3,149.7 C95.9,153.4 85.1,161.1 79.8,167.7 C79.2,168.5 78.5,169.3 78.4,169.4 C76.1,172.3 73.1,177.2 71.4,181.2 C69.4,185.9 67.8,191.6 66.9,198.0 C66.3,201.7 66.4,215.9 66.9,223.0 C67.4,228.8 67.4,238.0 67.0,241.6 C66.1,250.3 64.1,257.0 60.6,262.9 C57.2,268.6 52.9,272.3 47.7,274.1 L46.1,274.6 L34.4,274.6 C24.0,274.6 22.5,274.6 22.3,274.3ZM158.9,267.8 C159.4,267.6 160.0,267.2 160.2,267.0 C161.3,265.9 161.3,266.2 161.3,242.9 L161.3,221.4 L159.9,221.4 C159.2,221.3 158.2,221.2 157.7,221.1 C156.7,220.8 155.7,219.8 155.4,218.6 C155.2,217.9 155.1,209.2 155.1,186.7 L155.1,155.7 L153.5,155.0 C151.4,154.2 147.9,153.0 147.0,152.9 L146.3,152.7 L146.3,159.3 C146.3,163.0 146.4,177.8 146.6,192.2 L146.8,218.5 L146.3,219.5 C145.7,220.7 144.8,221.2 143.2,221.3 C142.5,221.3 141.3,221.3 140.4,221.3 L139.0,221.4 L139.0,243.3 C139.1,264.3 139.1,265.3 139.4,266.0 C139.7,266.5 140.1,267.0 140.5,267.3 C141.7,268.2 142.5,268.2 150.5,268.2 C157.3,268.1 158.2,268.1 158.9,267.8ZM106.5,267.4 C107.0,267.1 107.5,266.5 107.7,266.1 C108.1,265.3 108.1,264.5 108.1,243.3 L108.1,221.3 L105.1,221.2 C102.6,221.2 102.0,221.1 101.4,220.8 C100.6,220.3 100.0,219.6 99.8,218.6 C99.7,218.1 99.6,205.6 99.6,189.2 C99.6,173.4 99.6,160.5 99.5,160.5 C99.3,160.5 96.4,162.6 94.8,163.8 C92.6,165.6 89.5,168.7 88.1,170.6 C87.2,171.7 86.8,172.5 86.5,173.7 C86.1,175.2 86.1,175.2 86.1,220.5 L86.2,265.7 L86.8,266.5 C88.0,268.0 88.0,268.0 97.4,268.0 L105.7,267.9 L106.5,267.4ZM133.0,267.4 C134.7,266.2 134.6,268.3 134.6,243.4 L134.6,221.2 L132.2,221.2 C129.0,221.1 128.2,220.6 127.7,218.5 C127.5,217.8 127.5,207.1 127.5,184.3 L127.5,151.1 L126.7,151.2 C126.3,151.3 124.5,151.5 122.8,151.7 C121.1,152.0 119.4,152.2 119.1,152.3 L118.6,152.5 L118.6,167.8 C118.6,176.3 118.6,191.2 118.7,201.1 C118.7,218.7 118.7,219.0 118.3,219.7 C117.7,220.8 117.0,221.1 114.7,221.2 L112.6,221.3 L112.6,243.0 C112.5,258.3 112.6,264.9 112.7,265.4 C113.0,266.4 114.0,267.5 115.0,267.8 C115.5,267.9 118.4,268.0 123.9,268.0 L132.1,267.9 L133.0,267.4ZM185.1,267.8 C185.5,267.7 186.2,267.4 186.5,267.1 C187.8,266.0 187.7,268.9 187.7,220.9 C187.7,182.7 187.7,177.3 187.4,176.2 C186.5,172.6 181.6,165.7 177.8,162.6 C176.5,161.5 174.8,160.3 174.5,160.3 C174.5,160.3 174.4,173.5 174.4,189.5 C174.4,220.7 174.5,219.5 173.5,220.4 C172.5,221.2 171.7,221.4 168.5,221.3 L165.5,221.3 L165.4,242.7 C165.4,257.7 165.4,264.4 165.6,265.1 C165.9,266.3 166.5,267.1 167.8,267.7 C168.5,268.0 169.2,268.0 176.5,268.0 C181.3,268.0 184.7,268.0 185.1,267.8ZM172.6,65.0 L172.5,59.7 L171.3,59.1 C169.4,58.2 167.1,55.9 166.2,53.8 C165.0,51.5 164.5,49.4 164.5,47.1 C164.5,43.3 165.5,40.8 168.0,38.3 C170.2,36.1 172.4,35.2 175.7,35.2 C179.1,35.2 181.6,36.2 184.0,38.6 C185.6,40.2 186.7,42.2 187.2,44.2 C187.5,45.7 187.5,49.4 187.1,50.8 C186.3,54.2 183.5,58.0 180.7,59.4 L179.9,59.8 L180.0,62.0 C180.1,63.2 180.2,65.5 180.2,67.2 L180.2,70.2 L187.8,70.2 L195.4,70.1 L195.4,67.7 L195.4,65.2 L190.4,65.2 L185.4,65.2 L185.3,63.7 L185.3,62.1 L186.3,61.6 C187.1,61.3 188.1,60.5 189.3,59.3 C190.8,57.8 191.3,57.1 192.1,55.5 C196.2,47.6 193.6,37.8 186.1,33.0 C180.6,29.5 173.8,29.0 167.8,31.8 C162.7,34.1 159.0,38.4 157.9,43.2 C157.5,44.8 157.4,48.5 157.8,50.3 C158.8,55.0 162.1,59.5 166.1,61.6 L167.0,62.1 L167.0,63.6 L167.0,65.1 L163.4,65.2 C161.4,65.2 159.1,65.2 158.3,65.2 L156.8,65.2 L156.8,67.7 L156.8,70.2 L164.7,70.2 L172.6,70.2 L172.6,65.0ZM77.7,53.7 C79.1,53.4 81.4,52.4 81.4,52.2 C81.4,51.9 80.2,49.9 79.3,48.5 C76.0,43.6 71.5,42.7 66.0,45.8 C65.1,46.3 64.4,46.8 64.4,47.0 C64.4,47.4 66.7,50.4 67.9,51.5 C69.1,52.6 71.4,53.8 73.0,54.0 C74.3,54.3 76.2,54.1 77.7,53.7ZM67.2,23.8 C64.9,23.2 60.5,22.5 57.1,22.3 C55.6,22.2 54.3,22.1 54.2,22.1 C54.2,22.0 54.0,21.3 53.7,20.4 L53.2,18.9 L56.3,14.5 C63.1,4.7 65.0,2.0 65.2,2.0 C65.4,2.0 66.9,8.2 67.9,12.7 C68.5,15.6 69.7,23.0 69.7,23.9 C69.7,24.5 69.5,24.5 67.2,23.8Z" />
        </g>
        <g className="mp-cat--hello" fill="currentColor">
          <path
            fillRule="evenodd"
            d="
        M33 75
        C12 86 0 113 0 150
        C0 183 16 211 31 236
        C43 255 47 267 43 274
        L181 274
        C193 250 199 227 195 205
        C189 163 155 128 116 120
        C97 116 85 109 79 91
        C68 82 49 75 33 75 Z
        M123.0,150.9 118.0,151.8 117.6,153.0 118.1,210.0 117.0,211.4 112.0,211.4 111.2,212.0 111.3,266.0 112.0,267.4 133.0,267.3 134.0,267.1 134.4,266.0 134.4,212.0 133.0,211.4 128.0,211.4 127.0,211.0 126.8,210.0 126.8,151.0 123.0,150.9Z M98.0,160.5 89.0,168.2 86.7,171.0 85.6,174.0 85.5,266.0 86.0,267.4 105.0,267.4 106.0,267.0 106.3,266.0 106.2,212.0 105.0,211.4 100.0,211.4 99.2,210.0 99.3,161.0 98.0,160.5Z M146.0,152.2 145.5,153.0 146.0,210.0 145.0,211.4 140.0,211.4 139.2,212.0 139.4,266.0 140.0,267.2 161.0,267.1 162.1,266.0 161.7,212.0 161.0,211.4 155.0,211.4 154.5,210.0 154.6,156.0 154.0,154.6 146.0,152.2Z M174.0,160.1 173.8,211.0 166.7,212.0 166.9,266.0 168.0,267.0 186.0,266.8 187.0,266.0 187.3,177.0 185.5,172.0 181.4,166.0 177.0,161.7 174.0,160.1Z"
          />
          <path
            d="
        M177 164
        C198 161 218 182 229 205
        C240 231 238 258 223 270
        C212 277 201 270 204 259
        C213 251 220 242 220 230
        C220 206 206 188 184 181 Z"
          />
          <path
            d="
        M17 31 L29 3 L44 23
        Q54 18 66 23 L79 3 L91 32
        C100 43 101 67 93 80
        C86 95 73 101 54 102
        C35 102 21 96 14 83
        C6 67 7 44 17 31 Z"
          />
          <g className="mp-cat--eyes">
            <rect
              x="35.5"
              y="53.5"
              width="10"
              height="10"
              rx="1.6"
              fill="var(--mp-signature-surface, #f5f3ed)"
            />
            <rect
              x="63.5"
              y="53.5"
              width="10"
              height="10"
              rx="1.6"
              fill="var(--mp-signature-surface, #f5f3ed)"
            />
          </g>
        </g>
      </svg>
    </a>
  );
}

/** Modifiers alone are not a shortcut; the field waits for a real key. */
const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta']);
const NOOP_HOTKEY_CAPTURE = async (): Promise<void> => {};

/**
 * Turns a key press into an Electron accelerator. `event.code` is used for
 * letters and digits so the shortcut stays on the same physical key when the
 * user switches to a Russian layout.
 */
export function toAccelerator(event: {
  code: string;
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null;

  const parts: string[] = [];
  if (event.ctrlKey) parts.push('CommandOrControl');
  if (event.metaKey && !event.ctrlKey) parts.push('Super');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');

  let key: string | null = null;
  if (/^Key[A-Z]$/.test(event.code)) key = event.code.slice(3);
  else if (/^Digit[0-9]$/.test(event.code)) key = event.code.slice(5);
  else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(event.code)) key = event.code;
  else if (['Space', 'Tab', 'Backspace', 'Delete', 'Insert', 'Home', 'End'].includes(event.code))
    key = event.code;
  else if (event.code === 'Escape') key = 'Esc';
  else if (/^Arrow(Up|Down|Left|Right)$/.test(event.code)) key = event.code.slice(5);

  if (!key) return null;
  // A bare letter would fire while the user types anywhere else in Windows.
  if (parts.length === 0) return null;
  return [...parts, key].join('+');
}

/** Renders an accelerator the way the keys are labelled on the keyboard. */
export function formatAccelerator(accelerator: string): string {
  return accelerator
    .split('+')
    .map((part) => (part === 'CommandOrControl' ? 'Ctrl' : part))
    .join(' + ');
}

interface SettingsDialogProps {
  settings: AppSettings | null;
  onClose: () => void;
  onHotkeyChange: (accelerator: string) => Promise<{ ok: boolean; reason?: string }>;
  onHotkeyCapture?: (capturing: boolean) => Promise<void>;
  onCategoriesExpandedChange: (expanded: boolean) => void;
  onFilesExpandedChange?: (expanded: boolean) => void;
  onLanguageChange?: (language: 'ru' | 'en') => void;
  onNavReorderStart: () => void;
  categories?: string[];
  onClearHistory?: (input: ClearHistoryInput) => Promise<void>;
}

export function SettingsDialog({
  settings,
  onClose,
  onHotkeyChange,
  onHotkeyCapture = NOOP_HOTKEY_CAPTURE,
  onCategoriesExpandedChange,
  onFilesExpandedChange = () => {},
  onLanguageChange = () => {},
  onNavReorderStart,
  categories = [],
  onClearHistory = async () => {},
}: SettingsDialogProps) {
  const t = useT();
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [scope, setScope] = useState<ClearHistoryScope>('all');
  const [fileGroup, setFileGroup] = useState<FileGroup | null>(null);
  const [period, setPeriod] = useState('hour');
  const [category, setCategory] = useState('');
  const [exclude, setExclude] = useState<string[]>(() => ['starred', 'categories', ...categories.map((name) => `category:${name}`)]);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  async function requestClose() {
    await onHotkeyCapture(false);
    setCapturing(false);
    onClose();
  }

  async function startCapture() {
    await onHotkeyCapture(true);
    setCapturing(true);
    setError(null);
    setSaved(false);
  }

  async function cancelCapture() {
    await onHotkeyCapture(false);
    setCapturing(false);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // While capturing, Escape cancels the capture rather than the dialog.
      if (event.key === 'Escape' && !capturing) void requestClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [capturing, onHotkeyCapture, onClose]);

  useEffect(
    () => () => {
      if (capturing) void onHotkeyCapture(false);
    },
    [capturing, onHotkeyCapture],
  );

  async function captureKey(event: ReactKeyboardEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (event.key === 'Escape') {
      void cancelCapture();
      return;
    }
    const accelerator = toAccelerator(event);
    if (!accelerator) {
      setError('Нужно сочетание с Ctrl, Alt или Shift');
      return;
    }
    setError(null);
    const result = await onHotkeyChange(accelerator);
    if (result.ok) {
      await onHotkeyCapture(false);
      setCapturing(false);
      setSaved(true);
    } else {
      setError(result.reason ?? 'Не удалось назначить сочетание');
    }
  }

  if (clearOpen) {
    const periodButtons = [['hour', 'За час'], ['3hours', 'За 3 часа'], ['today', 'За сутки'], ['all', 'За всё время']];
    const scopeButtons: Array<[ClearHistoryScope, string]> = [['all', 'Все'], ['starred', 'Избранное'], ['text', 'Текст'], ['file', 'Файлы'], ['category', 'Категории']];
    const fileLabels: Record<FileGroup, string> = { documents: 'Документы', images: 'Изображения', audio: 'Аудио', files: 'Файлы', folders: 'Папки' };
    const fileGroups = DEFAULT_FILE_SECTION_ORDER.filter((value): value is FileGroup => value !== 'all');
    const options: Array<[string, string]> = [];
    if (scope !== 'starred') options.push(['starred', 'Избранное']);
    if (scope === 'all' || scope === 'starred' || scope === 'category') options.push(['text', 'Текст']);
    if (scope === 'all' || scope === 'starred' || scope === 'category') {
      options.push(['files', 'Файлы — выбрать всё']);
      for (const group of fileGroups) options.push([`file:${group}`, fileLabels[group]]);
    }
    if (scope === 'file' && !fileGroup) {
      for (const group of fileGroups) options.push([`file:${group}`, fileLabels[group]]);
    }
    options.push(['categories', 'Категории — выбрать всё']);
    options.push(...categories.map((name): [string, string] => [`category:${name}`, name]));
    function resetExclusions(nextScope: ClearHistoryScope) {
      setExclude([...(nextScope === 'starred' ? [] : ['starred']), 'categories', ...categories.map((name) => `category:${name}`)]);
    }
    const since = period === 'hour' ? Date.now() - 3600000 : period === '3hours' ? Date.now() - 10800000 : period === 'today' ? Date.now() - 86400000 : undefined;
    function toggleExclusion(key: string, checked: boolean) {
      const children = key === 'files' ? fileGroups.map((group) => `file:${group}`) : key === 'categories' ? categories.map((name) => `category:${name}`) : [];
      setExclude((current) => {
        const next = new Set(current);
        if (children.length) {
          for (const value of [key, ...children]) checked ? next.add(value) : next.delete(value);
        } else {
          checked ? next.add(key) : next.delete(key);
          if (!checked && key.startsWith('file:')) next.delete('files');
          if (!checked && key.startsWith('category:')) next.delete('categories');
        }
        return [...next];
      });
    }
    async function confirmClear() {
      if (clearing) return;
      setClearing(true);
      setClearError(null);
      try {
        await onClearHistory({ scope, category: scope === 'category' ? category || undefined : undefined, fileGroup: scope === 'file' ? fileGroup ?? undefined : undefined, since, exclude });
        setClearOpen(false);
      } catch {
        setClearError('Не удалось очистить историю. Попробуйте ещё раз.');
      } finally {
        setClearing(false);
      }
    }
    return <Overlay onClose={() => setClearOpen(false)} dismissOnBackdrop={false}><div className="popup settings-dialog clear-history-dialog" role="dialog" aria-label={t('Очистить историю')}>
      <div className="popup-head"><div className="popup-title">{t('Очистить историю')}</div><button className="item-card-action" aria-label={t('Закрыть')} onClick={() => setClearOpen(false)}><CloseIcon size={15} /></button></div>
      <div className="settings-button-grid">{periodButtons.map(([value, label]) => <button key={value} className={period === value ? 'button settings-choice active' : 'button settings-choice'} onClick={() => setPeriod(value)}>{t(label)}</button>)}</div>
      <div className="settings-button-grid">{scopeButtons.map(([value, label]) => <button key={value} className={scope === value ? 'button settings-choice active' : 'button settings-choice'} onClick={() => { setScope(value); setCategory(''); setFileGroup(null); resetExclusions(value); }}>{t(label)}</button>)}</div>
      {scope === 'file' && <div className="settings-button-grid clear-subsections">{[['all', 'Все файлы'], ...fileGroups.map((group): [string, string] => [group, fileLabels[group]])].map(([value, label]) => <button key={value} className={(fileGroup ?? 'all') === value ? 'button settings-choice active' : 'button settings-choice'} onClick={() => { setFileGroup(value === 'all' ? null : value as FileGroup); resetExclusions(scope); }}>{t(label)}</button>)}</div>}
      {scope === 'category' && <div className="settings-button-grid clear-subsections">{[['', 'Все категории'], ...categories.map((name): [string, string] => [name, name])].map(([value, label]) => <button key={value || '__all_categories'} className={category === value ? 'button settings-choice active' : 'button settings-choice'} onClick={() => { setCategory(value); resetExclusions(scope); }}>{value ? label : t(label)}</button>)}</div>}
      <div className="field"><span className="field-label">{t('Удалить из выбранного раздела/подраздела всё, кроме:')}</span><div className="settings-exclusions">{options.map(([value, label]) => <label className="field-row" key={value}><input type="checkbox" checked={exclude.includes(value)} onChange={e => toggleExclusion(value, e.target.checked)} /><span>{value.startsWith('category:') ? label : t(label)}</span></label>)}</div></div>
      {clearError && <div role="alert" className="field-hint">{t(clearError)}</div>}
      <div className="dialog-actions"><button className="button ghost" disabled={clearing} onClick={() => setClearOpen(false)}>{t('Отмена')}</button><button className="button danger" disabled={clearing} onClick={() => void confirmClear()}>{t('Очистить')}</button></div>
    </div></Overlay>;
  }

  return (
    <Overlay onClose={() => void requestClose()} dismissOnBackdrop={false}>
      <div
        className="popup settings-dialog"
        role="dialog"
        aria-label={t('Настройки')}
      >
        <div className="popup-head">
          <div className="popup-title">{t('Настройки')}</div>
          <button
            className="item-card-action"
            aria-label={t('Закрыть')}
            title={t('Закрыть')}
            onClick={() => void requestClose()}
          >
            <CloseIcon size={15} />
          </button>
        </div>

        <div className="field">
          <span className="field-label">{t('Горячая клавиша')}</span>
          <button
            type="button"
            className={capturing ? 'hotkey-field capturing' : 'hotkey-field'}
            aria-label={t('Горячая клавиша')}
            onClick={() => void startCapture()}
            onKeyDown={capturing ? (e) => void captureKey(e) : undefined}
          >
            {capturing
              ? t('Нажмите сочетание…')
              : settings
                ? formatAccelerator(settings.hotkey)
                : '—'}
          </button>
          {(error || saved) && <span className="field-hint">{t(error ?? 'Сохранено')}</span>}
        </div>

        <div className="field">
          <span className="field-label">{t('Разделы')}</span>
          <label className="field field-row"><input type="checkbox" checked={settings?.categoriesExpanded ?? false} onChange={(e) => onCategoriesExpandedChange(e.target.checked)} /><span>{t('Развернуть раздел категорий')}</span></label>
          <label className="field field-row"><input type="checkbox" checked={settings?.filesExpanded ?? false} onChange={(e) => onFilesExpandedChange(e.target.checked)} /><span>{t('Развернуть раздел файлов')}</span></label>
          <button type="button" className="button ghost wide" onClick={onNavReorderStart}>
            {t('Настроить разделы')}
          </button>
        </div>

        <div className="field">
          <span className="field-label">{t('История')}</span>
          <button type="button" className="button ghost wide" onClick={() => setClearOpen(true)}>{t('Очистить историю')}</button>
        </div>

        <div className="field">
          <span className="field-label">{t('Язык')}</span>
          <div className="settings-button-grid" role="group" aria-label={t('Язык')}>
            <button type="button" className={settings?.language !== 'en' ? 'button settings-choice active' : 'button settings-choice'} aria-pressed={settings?.language !== 'en'} onClick={() => onLanguageChange('ru')}>RU</button>
            <button type="button" className={settings?.language === 'en' ? 'button settings-choice active' : 'button settings-choice'} aria-pressed={settings?.language === 'en'} onClick={() => onLanguageChange('en')}>ENG</button>
          </div>
        </div>

        <div className="dialog-actions dialog-actions--split">
          <MurpianoSignature />
          <button type="button" className="button ghost" onClick={() => void requestClose()}>
            {t('Закрыть')}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
