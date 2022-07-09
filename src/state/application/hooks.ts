import { useAppDispatch } from "../hooks";
import { setOpenModal } from "./actions";
import { ApplicationModal } from "./reducer";
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { useAppSelector } from "state/hooks";
import { AppState } from "store";

export function useBlockNumber(chainId?: number): number | undefined {
  return useSelector(
    (state: AppState) => state.application.blockNumber[chainId ?? -1]
  );
}

export function useModalOpen(modal: ApplicationModal): boolean {
  const openModal = useAppSelector(
    (state: AppState) => state.application.openModal
  );
  return openModal === modal;
}

export function useToggleModal(modal: ApplicationModal): () => void {
  const open = useModalOpen(modal);
  const dispatch = useAppDispatch();
  return useCallback(
    () => dispatch(setOpenModal(open ? null : modal)),
    [dispatch, modal, open]
  );
}

export function useWalletModalToggle(): () => void {
  return useToggleModal(ApplicationModal.WALLET);
}
