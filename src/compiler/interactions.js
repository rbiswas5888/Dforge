/**
 * DesignForge AI - Prototype & Interaction Compiler
 * Translates prototype links, modal overlays, and interactive triggers into functional React state
 */

export class InteractionCompiler {
  constructor(document) {
    this.doc = document;
  }

  /**
   * Scans document for interactions and builds an interaction summary
   */
  analyzeInteractions() {
    const list = [];
    for (const page of this.doc.pages || []) {
      for (const [nid, node] of Object.entries(page.nodes || {})) {
        if (node.interactions && node.interactions.length > 0) {
          for (const inter of node.interactions) {
            list.push({
              sourceNodeId: nid,
              sourceNodeName: node.name,
              trigger: inter.trigger || 'click',
              action: inter.action || 'navigate',
              targetId: inter.targetId,
              animation: inter.animation || 'instant'
            });
          }
        }
      }
    }
    return list;
  }

  /**
   * Generates a lightweight React interaction context helper
   */
  generateInteractionHelper() {
    return `import React, { createContext, useContext, useState } from 'react';

interface InteractionContextType {
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  currentPage: string;
  navigate: (pageId: string) => void;
}

const InteractionContext = createContext<InteractionContextType>({
  activeModal: null,
  openModal: () => {},
  closeModal: () => {},
  currentPage: 'default',
  navigate: () => {},
});

export const InteractionProvider: React.FC<{ children: React.ReactNode; initialPage?: string }> = ({
  children,
  initialPage = 'default',
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string>(initialPage);

  return (
    <InteractionContext.Provider
      value={{
        activeModal,
        openModal: (id) => setActiveModal(id),
        closeModal: () => setActiveModal(null),
        currentPage,
        navigate: (pageId) => setCurrentPage(pageId),
      }}
    >
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteraction = () => useContext(InteractionContext);
`;
  }
}
