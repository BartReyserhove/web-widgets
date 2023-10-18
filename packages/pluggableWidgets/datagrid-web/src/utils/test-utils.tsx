import { createElement } from "react";
import { GUID, ObjectItem } from "mendix";
import { dynamicValue, listAttr, listExp } from "@mendix/widget-plugin-test-utils";
import { WidgetProps } from "../components/Widget";
import { ColumnsType } from "../../typings/DatagridProps";
import { Cell } from "../components/Cell";
import { GridColumn } from "../typings/GridColumn";
import { Column } from "../helpers/Column";
import { GridSelectionProps } from "@mendix/widget-plugin-grid/selection/useGridSelectionProps";

export const column = (header = "Test", patch?: (col: ColumnsType) => void): ColumnsType => {
    const c: ColumnsType = {
        alignment: "left" as const,
        attribute: listAttr(() => "Attr value"),
        dynamicText: listExp(() => "Dynamic text"),
        draggable: false,
        header: dynamicValue(header),
        hidable: "no" as const,
        resizable: false,
        showContentAs: "attribute",
        size: 1,
        sortable: false,
        width: "autoFill" as const,
        wrapText: false
    };

    if (patch) {
        patch(c);
    }

    return c;
};

export function mockSelectionProps(patch?: (props: GridSelectionProps) => GridSelectionProps): GridSelectionProps {
    const props: GridSelectionProps = {
        selectionType: "None",
        selectionMethod: "checkbox",
        multiselectable: undefined,
        showCheckboxColumn: false,
        showSelectAllToggle: false,
        onSelect: jest.fn(),
        onSelectAll: jest.fn(),
        isSelected: jest.fn(() => false)
    };

    if (patch) {
        patch(props);
    }

    return props;
}

export function mockWidgetProps(): WidgetProps<GridColumn, ObjectItem> {
    const id = "dg1";
    const columnsProp = [column("Test")];

    const selectionProps = mockSelectionProps();

    return {
        CellComponent: Cell,
        className: "test",
        columns: columnsProp.map((col, index) => new Column(col, index, id)),
        columnsDraggable: false,
        columnsFilterable: false,
        columnsHidable: false,
        columnsResizable: false,
        columnsSortable: false,
        data: [{ id: "123456" as GUID }],
        exporting: false,
        filterRenderer: () => <input type="text" defaultValue="dummy" />,
        hasMoreItems: false,
        headerWrapperRenderer: (_index, header) => header,
        id,
        page: 1,
        pageSize: 10,
        paging: false,
        pagingPosition: "bottom",
        processedRows: 0,
        selectionProps,
        selectionStatus: "unknown",
        setPage: jest.fn(),
        valueForSort: () => "dummy"
    };
}
