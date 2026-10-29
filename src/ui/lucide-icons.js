import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Accessibility,
  AlignCenter,
  ArrowLeftRight,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Bell,
  Bot,
  BookOpen,
  Bug,
  Box,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChartNoAxesColumn,
  Circle,
  CircleHelp,
  Clock3,
  Code2,
  Contrast,
  Copy,
  CreditCard,
  Crop,
  Download,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Folder,
  Frame,
  Gem,
  Globe,
  Hand,
  History,
  Image,
  Info,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Keyboard,
  Link,
  LockKeyhole,
  LockOpen,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  Monitor,
  Moon,
  MousePointer2,
  Paintbrush,
  Palette,
  PanelLeftClose,
  PanelRight,
  PenTool,
  Pencil,
  Pin,
  Pipette,
  Play,
  Plus,
  Redo2,
  Ruler,
  RotateCcw,
  Save,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Scaling,
  SlidersHorizontal,
  Sparkles,
  Square,
  SquareDashed,
  Star,
  Sun,
  Tablet,
  ShoppingCart,
  Target,
  Triangle,
  TriangleAlert,
  Trash2,
  Type,
  Undo2,
  Upload,
  UserRound,
  UsersRound,
  WandSparkles,
  Wrench,
  X,
  Zap,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const icons = {
  Activity,
  Accessibility,
  AlignCenter,
  ArrowLeftRight,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Bell,
  Bot,
  BookOpen,
  Bug,
  Box,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChartNoAxesColumn,
  Circle,
  CircleHelp,
  Clock3,
  Code2,
  Contrast,
  Copy,
  CreditCard,
  Crop,
  Download,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Folder,
  Frame,
  Gem,
  Globe,
  Hand,
  History,
  Image,
  Info,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Keyboard,
  Link,
  LockKeyhole,
  LockOpen,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  Monitor,
  Moon,
  MousePointer2,
  Paintbrush,
  Palette,
  PanelLeftClose,
  PanelRight,
  PenTool,
  Pencil,
  Pin,
  Pipette,
  Play,
  Plus,
  Redo2,
  Ruler,
  RotateCcw,
  Save,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Scaling,
  SlidersHorizontal,
  Sparkles,
  Square,
  SquareDashed,
  Star,
  Sun,
  Tablet,
  ShoppingCart,
  Target,
  Triangle,
  TriangleAlert,
  Trash2,
  Type,
  Undo2,
  Upload,
  UserRound,
  UsersRound,
  WandSparkles,
  Wrench,
  X,
  Zap,
  ZoomIn,
  ZoomOut
};

const mountedRoots = new WeakMap();

function mountIcon(element) {
  const Icon = icons[element.dataset.icon];
  if (!Icon) {
    console.error(`Unknown Lucide icon: ${element.dataset.icon}`);
    return;
  }

  const size = Number(element.dataset.iconSize) || 16;
  element.classList.add('app-icon');
  element.setAttribute('aria-hidden', 'true');
  element.style.setProperty('--icon-size', `${size}px`);
  let root = mountedRoots.get(element);
  if (!root) {
    root = createRoot(element);
    mountedRoots.set(element, root);
  }
  root.render(createElement(Icon, {
    size,
    strokeWidth: 1.8,
    focusable: false
  }));
}

export function mountLucideIcons(container = document.body) {
  const scan = node => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches('[data-icon]') && !mountedRoots.has(node)) mountIcon(node);
    node.querySelectorAll('[data-icon]').forEach(element => {
      if (!mountedRoots.has(element)) mountIcon(element);
    });
  };

  scan(container);
  const observer = new MutationObserver(records => {
    records.forEach(record => {
      if (record.type === 'attributes') {
        mountIcon(record.target);
        return;
      }
      record.addedNodes.forEach(scan);
    });
  });
  observer.observe(container, { attributes: true, attributeFilter: ['data-icon'], childList: true, subtree: true });

  return () => {
    observer.disconnect();
    container.querySelectorAll('[data-icon]').forEach(element => {
      mountedRoots.get(element)?.unmount();
      mountedRoots.delete(element);
    });
  };
}
