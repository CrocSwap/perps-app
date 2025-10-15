declare module '~/tv/charting_library' {
    export type EntityId = Nominal<string, 'EntityId'>;

    export type LanguageCode = string;
    export type ResolutionString = string;
    export interface IBasicDataFeed {
        onReady?: (callback: () => void) => void;
        getBars?: (...args: any[]) => void;
        subscribeBars?: (...args: any[]) => void;
        unsubscribeBars?: (...args: any[]) => void;
    }

    export interface IChartingLibraryWidget {
        headerReady(): Promise<void>;
        onChartReady(callback: EmptyCallback): void;
        onGrayedObjectClicked(callback: (obj: GrayedObject) => void): void;
        onShortcut(
            shortCut: string | number | (string | number)[],
            callback: EmptyCallback,
        ): void;
        subscribe<EventName extends keyof SubscribeEventsMap>(
            event: EventName,
            callback: SubscribeEventsMap[EventName],
        ): void;
        unsubscribe<EventName extends keyof SubscribeEventsMap>(
            event: EventName,
            callback: SubscribeEventsMap[EventName],
        ): void;
        chart(index?: number): IChartWidgetApi;
        getLanguage(): LanguageCode;
        setSymbol(
            symbol: string,
            interval: ResolutionString,
            callback: EmptyCallback,
        ): void;
        remove(): void;
        closePopupsAndDialogs(): void;
        selectLineTool(linetool: 'icon', options?: IconOptions): Promise<void>;
        selectLineTool(
            linetool: Omit<'icon', SupportedLineTools>,
        ): Promise<void>;
        selectLineTool(linetool: 'icon', options?: IconOptions): Promise<void>;
        selectLineTool(
            linetool: 'emoji',
            options?: EmojiOptions,
        ): Promise<void>;
        selectLineTool(
            linetool: SupportedLineTools,
            options?: IconOptions | EmojiOptions,
        ): Promise<void>;
        selectedLineTool(): SupportedLineTools;
        save(
            callback: (state: object) => void,
            options?: SaveChartOptions,
        ): void;
        load(state: object, extendedData?: SavedStateMetaInfo): Promise<void>;
        getSavedCharts(
            callback: (chartRecords: SaveLoadChartRecord[]) => void,
        ): void;
        loadChartFromServer(chartRecord: SaveLoadChartRecord): Promise<void>;
        saveChartToServer(
            onComplete?: EmptyCallback,
            onFail?: (error: SaveChartErrorInfo) => void,
            options?: SaveChartToServerOptions,
        ): void;
        removeChartFromServer(
            chartId: string | number,
            onCompleteCallback: EmptyCallback,
        ): void;
        onContextMenu(
            callback: (unixTime: number, price: number) => ContextMenuItem[],
        ): void;
        createButton(options?: CreateHTMLButtonOptions): HTMLElement;
        createButton(options: CreateTradingViewStyledButtonOptions): string;
        createButton(options?: CreateButtonOptions): HTMLElement | string;
        removeButton(buttonIdOrHtmlElement: HTMLElement | string): void;
        createDropdown(params: DropdownParams): Promise<IDropdownApi>;
        showNoticeDialog(params: DialogParams<() => void>): void;
        showConfirmDialog(
            params: DialogParams<(confirmed: boolean) => void>,
        ): void;
        showLoadChartDialog(): void;
        showSaveAsChartDialog(): void;
        symbolInterval(): SymbolIntervalResult;
        mainSeriesPriceFormatter(): INumberFormatter;
        getIntervals(): string[];
        getStudiesList(): string[];
        getStudyInputs(studyName: string): StudyInputInformation[];
        getStudyStyles(studyName: string): StudyStyleInfo;
        addCustomCSSFile(url: string): void;
        applyOverrides<TOverrides extends Partial<ChartPropertiesOverrides>>(
            overrides: TOverrides,
        ): void;
        applyStudiesOverrides(overrides: object): void;
        applyTradingCustomization(
            tradingCustomization: TradingCustomization,
        ): Promise<void>;
        watchList(): Promise<IWatchListApi>;
        news(): Promise<INewsApi>;
        widgetbar(): Promise<IWidgetbarApi>;
        activeChart(): IChartWidgetApi;
        activeChartIndex(): number;
        setActiveChart(index: number): void;
        chartsCount(): number;
        unloadUnusedCharts(): void;
        layout(): LayoutType;
        setLayout(layout: LayoutType): void;
        layoutName(): string;
        resetLayoutSizes(disableUndo?: boolean): void;
        setLayoutSizes(
            sizes: Partial<LayoutSizes>,
            disableUndo?: boolean,
        ): void;
        changeTheme(
            themeName: ThemeName,
            options?: ChangeThemeOptions,
        ): Promise<void>;
        getTheme(): ThemeName;
        takeScreenshot(): void;
        takeClientScreenshot(
            options?: Partial<ClientSnapshotOptions>,
        ): Promise<HTMLCanvasElement>;
        lockAllDrawingTools(): IWatchedValue<boolean>;
        hideAllDrawingTools(): IWatchedValue<boolean>;
        magnetEnabled(): IWatchedValue<boolean>;
        magnetMode(): IWatchedValue<number>;
        symbolSync(): IWatchedValue<boolean>;
        intervalSync(): IWatchedValue<boolean>;
        crosshairSync(): IWatchedValue<boolean>;
        timeSync(): IWatchedValue<boolean>;
        dateRangeSync(): IWatchedValue<boolean>;
        startFullscreen(): void;
        exitFullscreen(): void;
        undoRedoState(): UndoRedoState;
        navigationButtonsVisibility(): IWatchedValue<VisibilityType>;
        paneButtonsVisibility(): IWatchedValue<VisibilityType>;
        dateFormat(): IWatchedValue<DateFormat>;
        timeHoursFormat(): IWatchedValue<TimeHoursFormat>;
        currencyAndUnitVisibility(): IWatchedValue<VisibilityType>;
        setDebugMode(enabled: boolean): void;
        drawOnAllChartsEnabled(): IWatchedValue<boolean>;
        clearUndoHistory(): void;
        supportedChartTypes(): IWatchedValueReadonly<ChartStyle[]>;
        watermark(): IWatermarkApi;
        customSymbolStatus(): ICustomSymbolStatusApi;
        setCSSCustomProperty(customPropertyName: string, value: string): void;
        getCSSCustomPropertyValue(customPropertyName: string): string;
        customThemes(): Promise<ICustomThemesApi>;
        resetCache(): void;
    }

    export type TradingTerminalFeatureset = 'something';
    export interface IPaneApi {
        hasMainSeries(): boolean;
        getLeftPriceScales(): readonly IPriceScaleApi[];
        getRightPriceScales(): readonly IPriceScaleApi[];
        getMainSourcePriceScale(): IPriceScaleApi | null;
        getPriceScaleById(priceScaleId: string): IPriceScaleApi | null;
        getHeight(): number;
        setHeight(height: number): void;
        moveTo(paneIndex: number): void;
        paneIndex(): number;
        collapse(): void;
        restore(): void;
        isCollapsed(): boolean;
        setMaximized(value: boolean): void;
        isMaximized(): boolean;
    }

    export interface Bar {
        time: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume?: number;
    }

    export interface IDatafeedChartApi {
        onReady?: (callback: () => void) => void;
        getBars?: (...args: any[]) => void;
        subscribeBars?: (...args: any[]) => void;
        unsubscribeBars?: (...args: any[]) => void;
    }

    export interface LibrarySymbolInfo {
        name?: string;
        ticker?: string;
        description?: string;
        type?: string;
        session?: string;
        timezone?: string;
        minmov?: number;
        pricescale?: number;
        supported_resolutions?: string[];
        [key: string]: unknown;
    }

    export interface Mark {
        id?: string | number;
        time?: number;
        color?: string;
        text?: string;
        label?: string;
        labelFontColor?: string;
        minSize?: number;
        [key: string]: unknown;
    }

    export type OnReadyCallback = (config: Record<string, unknown>) => void;

    export type ColorGradient = string | string[];

    export interface CustomThemeColors {
        color1: ColorGradient;
        color2: ColorGradient;
        color3: ColorGradient;
        color4: ColorGradient;
        color5: ColorGradient;
        color6: ColorGradient;
        color7: ColorGradient;
        white: string;
        black: string;
    }

    export interface CustomThemes {
        [name: string]: CustomThemeColors;
    }
}
