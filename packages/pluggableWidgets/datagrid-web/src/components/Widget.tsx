import { Pagination } from "@mendix/widget-plugin-grid/components/Pagination";
import { SelectionStatus } from "@mendix/widget-plugin-grid/selection";
import { GridSelectionProps } from "@mendix/widget-plugin-grid/selection/useGridSelectionProps";
import { Big } from "big.js";
import classNames from "classnames";
import { EditableValue, ListActionValue, ObjectItem } from "mendix";
import {
    CSSProperties,
    ReactElement,
    ReactNode,
    createElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { PagingPositionEnum } from "../../typings/DatagridProps";
import { ColumnWidthConfig, SortingRule, useSettings } from "../features/settings";
import { WidgetPropsProvider } from "../helpers/useWidgetProps";
import { sortColumns } from "../helpers/utils";
import { CellComponent } from "../typings/CellComponent";
import { GridColumn } from "../typings/GridColumn";
import { CheckboxColumnHeader } from "./CheckboxColumnHeader";
import { ColumnResizer } from "./ColumnResizer";
import { ColumnSelector } from "./ColumnSelector";
import { Grid } from "./Grid";
import { GridBody } from "./GridBody";
import { Header } from "./Header";
import { ProgressModal } from "./ProgressModal";
import { Row } from "./Row";
import { WidgetContent } from "./WidgetContent";
import { WidgetFooter } from "./WidgetFooter";
import { WidgetHeader } from "./WidgetHeader";
import { WidgetRoot } from "./WidgetRoot";
import { WidgetTopBar } from "./WidgetTopBar";

export interface WidgetProps<C extends GridColumn, T extends ObjectItem = ObjectItem> {
    CellComponent: CellComponent<C>;
    className: string;
    columns: C[];
    columnsDraggable: boolean;
    columnsFilterable: boolean;
    columnsHidable: boolean;
    columnsResizable: boolean;
    columnsSortable: boolean;
    data: T[];
    emptyPlaceholderRenderer?: (renderWrapper: (children: ReactNode) => ReactElement) => ReactElement;
    exporting: boolean;
    filterRenderer: (renderWrapper: (children: ReactNode) => ReactElement, columnIndex: number) => ReactElement;
    hasMoreItems: boolean;
    headerContent?: ReactNode;
    headerTitle?: string;
    headerWrapperRenderer: (columnIndex: number, header: ReactElement) => ReactElement;
    id?: string;
    numberOfItems?: number;
    page: number;
    pageSize: number;
    paging: boolean;
    pagingPosition: PagingPositionEnum;
    preview?: boolean;
    processedRows: number;
    rowAction?: ListActionValue;
    rowClass?: (item: T) => string;
    selectionProps: GridSelectionProps;
    selectionStatus: SelectionStatus;
    setPage?: (computePage: (prevPage: number) => number) => void;
    setSortParameters?: (sort?: SortProperty) => void;
    settings?: EditableValue<string>;
    showSelectAllToggle?: boolean;
    styles?: CSSProperties;
    valueForSort: (value: T, columnIndex: number) => string | Big | boolean | Date | undefined;
}

export interface SortProperty {
    columnIndex: number;
    desc: boolean;
}

export function Widget<C extends GridColumn>(props: WidgetProps<C>): ReactElement {
    const {
        className,
        columns,
        columnsDraggable,
        columnsFilterable,
        columnsHidable,
        columnsResizable,
        columnsSortable,
        data: rows,
        emptyPlaceholderRenderer,
        exporting,
        filterRenderer: filterRendererProp,
        headerContent,
        headerTitle,
        hasMoreItems,
        headerWrapperRenderer,
        id,
        numberOfItems,
        page,
        pageSize,
        paging,
        pagingPosition,
        preview,
        processedRows,
        setPage,
        setSortParameters,
        settings,
        styles,
        selectionProps,
        CellComponent
    } = props;
    const isInfinite = !paging;
    const [isDragging, setIsDragging] = useState(false);
    const [dragOver, setDragOver] = useState("");
    const [columnOrder, setColumnOrder] = useState<number[]>([]);
    const [hiddenColumns, setHiddenColumns] = useState<number[]>(
        columns.flatMap(c => (columnsHidable && c.hidden && !preview ? [c.columnNumber] : []))
    );
    const [sortBy, setSortBy] = useState<SortingRule[]>([]);
    const [columnsWidth, setColumnsWidth] = useState<ColumnWidthConfig>(
        Object.fromEntries(columns.map(c => [c.columnNumber, undefined]))
    );
    const [isModalOpen, setIsModalOpen] = useState(true);
    const containerRef = useRef(null);
    const showHeader = !!headerContent;
    const showTopBar = paging && (pagingPosition === "top" || pagingPosition === "both");

    const { updateSettings } = useSettings(
        settings,
        columns,
        columnOrder,
        setColumnOrder,
        hiddenColumns,
        setHiddenColumns,
        sortBy,
        setSortBy,
        columnsWidth,
        setColumnsWidth
    );

    useEffect(() => updateSettings(), [columnOrder, hiddenColumns, sortBy, updateSettings]);

    useEffect(() => {
        const [sortingRule] = sortBy;
        if (sortingRule !== undefined) {
            setSortParameters?.({
                columnIndex: sortingRule.columnNumber,
                desc: sortingRule.desc
            });
        } else {
            setSortParameters?.(undefined);
        }
    }, [sortBy, setSortParameters]);

    useEffect(() => {
        if (exporting !== isModalOpen) {
            setIsModalOpen(exporting);
        }
    }, [exporting, isModalOpen]);

    useEffect(() => {
        if (isModalOpen) {
            console.info("running body stuff");
            // Pushing the change to the end of the call stack
            const timer = setTimeout(() => {
                document.body.style.pointerEvents = "";
            }, 0);

            return () => clearTimeout(timer);
        } else {
            document.body.style.pointerEvents = "auto";
        }
    });

    console.info(exporting);
    console.info(setIsModalOpen);

    const renderFilterWrapper = useCallback(
        (children: ReactNode) => (
            <div className="filter" style={{ pointerEvents: isDragging ? "none" : undefined }}>
                {children}
            </div>
        ),
        [isDragging]
    );

    const visibleColumns = useMemo(() => {
        return columns
            .filter(c => !hiddenColumns.includes(c.columnNumber))
            .sort((a, b) => sortColumns(columnOrder, a, b));
    }, [hiddenColumns, columnOrder, columns]);

    const pagination = paging ? (
        <Pagination
            canNextPage={hasMoreItems}
            canPreviousPage={page !== 0}
            gotoPage={(page: number) => setPage && setPage(() => page)}
            nextPage={() => setPage && setPage(prev => prev + 1)}
            numberOfItems={numberOfItems}
            page={page}
            pageSize={pageSize}
            previousPage={() => setPage && setPage(prev => prev - 1)}
        />
    ) : null;

    const cssGridStyles = useMemo(
        () =>
            gridStyle(visibleColumns, columnsWidth, {
                selectItemColumn: selectionProps.showCheckboxColumn,
                visibilitySelectorColumn: columnsHidable
            }),
        [columnsWidth, visibleColumns, columnsHidable, selectionProps.showCheckboxColumn]
    );

    const onDialogClose = () => {
        setIsModalOpen(false);
        window.__abort();
    };

    return (
        <WidgetPropsProvider value={props}>
            <WidgetRoot
                className={className}
                selectionMethod={selectionProps.selectionMethod}
                selection={selectionProps.selectionType !== "None"}
                style={styles}
                ref={containerRef}
            >
                {showTopBar && <WidgetTopBar>{pagination}</WidgetTopBar>}
                {showHeader && <WidgetHeader headerTitle={headerTitle}>{headerContent}</WidgetHeader>}
                <WidgetContent isInfinite={isInfinite} hasMoreItems={hasMoreItems} setPage={setPage}>
                    <Grid aria-multiselectable={selectionProps.multiselectable}>
                        <GridBody style={cssGridStyles}>
                            <div key="headers_row" className="tr" role="row">
                                <CheckboxColumnHeader key="headers_column_select_all" />
                                {visibleColumns.map((column, index) =>
                                    headerWrapperRenderer(
                                        index,
                                        <Header
                                            key={`${column.columnId}`}
                                            className={`align-column-${column.alignment}`}
                                            column={column}
                                            draggable={columnsDraggable}
                                            dragOver={dragOver}
                                            filterable={columnsFilterable}
                                            filterWidget={filterRendererProp(renderFilterWrapper, column.columnNumber)}
                                            hidable={columnsHidable}
                                            isDragging={isDragging}
                                            preview={preview}
                                            resizable={columnsResizable}
                                            resizer={
                                                <ColumnResizer
                                                    onResizeEnds={updateSettings}
                                                    setColumnWidth={(width: number) =>
                                                        setColumnsWidth(prev => {
                                                            prev[column.columnNumber] = width;
                                                            return { ...prev };
                                                        })
                                                    }
                                                />
                                            }
                                            setColumnOrder={(newOrder: number[]) => setColumnOrder(newOrder)}
                                            setDragOver={setDragOver}
                                            setIsDragging={setIsDragging}
                                            setSortBy={setSortBy}
                                            sortable={columnsSortable}
                                            sortBy={sortBy}
                                            visibleColumns={visibleColumns}
                                            tableId={`${props.id}`}
                                        />
                                    )
                                )}
                                {columnsHidable && (
                                    <ColumnSelector
                                        key="headers_column_selector"
                                        columns={columns}
                                        hiddenColumns={hiddenColumns}
                                        id={id}
                                        setHiddenColumns={setHiddenColumns}
                                    />
                                )}
                            </div>
                            {rows.map((item, rowIndex) => {
                                return (
                                    <Row
                                        CellComponent={CellComponent}
                                        className={props.rowClass?.(item)}
                                        columns={visibleColumns}
                                        index={rowIndex}
                                        item={item}
                                        key={`row_${item.id}`}
                                        rowAction={props.rowAction}
                                        showSelectorCell={columnsHidable}
                                    />
                                );
                            })}
                            {(rows.length === 0 || preview) &&
                                emptyPlaceholderRenderer &&
                                emptyPlaceholderRenderer(children => {
                                    const colspan =
                                        columns.length +
                                        (columnsHidable ? 1 : 0) +
                                        (props.selectionProps.showCheckboxColumn ? 1 : 0);
                                    return (
                                        <div
                                            key="row-footer"
                                            className={classNames("td", { "td-borders": !preview })}
                                            style={{
                                                gridColumn: `span ${colspan}`
                                            }}
                                        >
                                            <div className="empty-placeholder">{children}</div>
                                        </div>
                                    );
                                })}
                        </GridBody>
                    </Grid>
                </WidgetContent>
                <WidgetFooter pagination={pagination} pagingPosition={pagingPosition} />
            </WidgetRoot>
            <ProgressModal
                container={containerRef.current}
                onCancel={onDialogClose}
                open={isModalOpen}
                progress={processedRows}
                total={numberOfItems}
            />
        </WidgetPropsProvider>
    );
}

function gridStyle(columns: GridColumn[], resizeMap: ColumnWidthConfig, optional: OptionalColumns): CSSProperties {
    const columnSizes = columns.map(c => {
        const columnResizedSize = resizeMap[c.columnNumber];
        if (columnResizedSize) {
            return `${columnResizedSize}px`;
        }
        switch (c.width) {
            case "autoFit":
                return "fit-content(100%)";
            case "manual":
                return `${c.weight}fr`;
            default:
                return "1fr";
        }
    });

    const sizes: string[] = [];

    if (optional.selectItemColumn) {
        sizes.push("fit-content(48px)");
    }

    sizes.push(...columnSizes);

    if (optional.visibilitySelectorColumn) {
        sizes.push("fit-content(50px)");
    }

    return {
        gridTemplateColumns: sizes.join(" ")
    };
}

type OptionalColumns = {
    selectItemColumn?: boolean;
    visibilitySelectorColumn?: boolean;
};
