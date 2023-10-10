import { executeAction } from "@mendix/widget-plugin-platform/framework/execute-action";
import { ListExpressionValue, ListWidgetValue, ListActionValue, ObjectItem } from "mendix";
import { ReactNode, useMemo, createElement } from "react";
import { GalleryItemHelper } from "../typings/GalleryItem";
import { ListItemButton } from "../components/ListItemButton";

type ClassValue = ListExpressionValue<string> | undefined;
type ContentValue = ListWidgetValue | undefined;
type ClickValue = ListActionValue | undefined;

export class WidgetItem implements GalleryItemHelper {
    private _classValue: ClassValue;
    private _contentValue: ContentValue;
    private _clickValue: ClickValue;

    constructor(classValue: ClassValue, contentValue: ContentValue, clickValue: ClickValue) {
        this._classValue = classValue;
        this._contentValue = contentValue;
        this._clickValue = clickValue;
    }

    itemClass(item: ObjectItem): string | undefined {
        return this._classValue?.get(item).value;
    }

    render(item: ObjectItem): ReactNode {
        if (this.clickable(item)) {
            return (
                <ListItemButton onClick={() => executeAction(this._clickValue?.get(item))}>
                    {this._contentValue?.get(item)}
                </ListItemButton>
            );
        }

        return this._contentValue?.get(item);
    }

    clickable(item: ObjectItem): boolean {
        return !!this._clickValue?.get(item);
    }
}

export function useWidgetItem(params: {
    classValue: ClassValue;
    contentValue: ContentValue;
    clickValue: ClickValue;
}): WidgetItem {
    return useMemo(
        () => new WidgetItem(params.classValue, params.contentValue, params.clickValue),
        [params.classValue, params.contentValue, params.clickValue]
    );
}
