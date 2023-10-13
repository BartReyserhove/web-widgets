import { createElement, FC, ReactElement } from "react";
import * as Dialog from "@radix-ui/react-dialog";

type ProgressModalProps = {
    onOpenChange: (open: boolean) => void;
    open: boolean;
};

export const ProgressModal: FC<ProgressModalProps> = (props): ReactElement => {
    return (
        <Dialog.Root {...props}>
            <Dialog.Overlay className="widget-datagrid-modal-overlay" />
            <Dialog.Content className="widget-datagrid-modal-content">
                <Dialog.Close className="widget-datagrid-modal-close" asChild>
                    Close button
                </Dialog.Close>
                {/* <Dialog.Title /> */}
                <Dialog.Description className="widget-datagrid-modal-description">
                    Progress and progress bar
                </Dialog.Description>
                {/* <Dialog.Cancel /> */}
                {/* <Dialog.Action /> */}
            </Dialog.Content>
        </Dialog.Root>
    );
};
