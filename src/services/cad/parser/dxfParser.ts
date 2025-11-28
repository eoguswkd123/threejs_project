/**
 * DXF 파서 구현
 * DXF 파일을 파싱하여 CADData 형식으로 변환
 */

import type {
    CADData,
    CADEntity,
    CADLayer,
    CADUnit,
    LineEntity,
    CircleEntity,
    ArcEntity,
    PolylineEntity,
    PointEntity,
    TextEntity,
    SplineEntity,
    EllipseEntity,
    BoundingBox,
    ParseOptions,
    ParseResult,
    ParseError,
    Vector3,
} from '@types/cad';

import type {
    DXFDocument,
    DXFEntity,
    DXFLine,
    DXFCircle,
    DXFArc,
    DXFPolyline,
    DXFPoint,
    DXFText,
    DXFSpline,
    DXFEllipse,
    DXFLayerEntry,
    DXFHeader,
} from './types';

/**
 * DXF 파일 파서 클래스
 */
export class DxfParser {
    private lines: string[] = [];
    private currentIndex = 0;

    /**
     * DXF 파일 내용을 파싱
     */
    async parse(content: string, options?: ParseOptions): Promise<ParseResult> {
        const startTime = performance.now();
        const errors: ParseError[] = [];

        try {
            // 줄 단위로 분리
            this.lines = content.split(/\r?\n/);
            this.currentIndex = 0;

            // DXF 문서 파싱
            const dxfDoc = this.parseDXFDocument();

            // CADData로 변환
            const cadData = this.convertToCADData(dxfDoc, options);

            // 옵션 적용
            if (options?.layerFilter && options.layerFilter.length > 0) {
                cadData.entities = cadData.entities.filter((e) =>
                    options.layerFilter?.includes(e.layer)
                );
            }

            if (options?.maxEntities && cadData.entities.length > options.maxEntities) {
                cadData.entities = cadData.entities.slice(0, options.maxEntities);
            }

            return {
                success: true,
                data: cadData,
                errors: errors.length > 0 ? errors : undefined,
                parseTime: performance.now() - startTime,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown parsing error';
            errors.push({
                code: 'PARSE_ERROR',
                message,
                line: this.currentIndex,
            });

            return {
                success: false,
                errors,
                parseTime: performance.now() - startTime,
            };
        }
    }

    /**
     * DXF 문서 전체 파싱
     */
    private parseDXFDocument(): DXFDocument {
        const header: DXFHeader = {};
        const layers: DXFLayerEntry[] = [];
        const entities: DXFEntity[] = [];

        while (this.currentIndex < this.lines.length) {
            const code = this.readCode();
            const value = this.readValue();

            if (code === 0 && value === 'SECTION') {
                const sectionCode = this.readCode();
                const sectionName = this.readValue();

                switch (sectionName) {
                    case 'HEADER':
                        Object.assign(header, this.parseHeaderSection());
                        break;
                    case 'TABLES':
                        layers.push(...this.parseTablesSection());
                        break;
                    case 'ENTITIES':
                        entities.push(...this.parseEntitiesSection());
                        break;
                    case 'BLOCKS':
                    case 'OBJECTS':
                    case 'CLASSES':
                        this.skipSection();
                        break;
                }
            } else if (code === 0 && value === 'EOF') {
                break;
            }
        }

        return { header, layers, entities };
    }

    /**
     * HEADER 섹션 파싱
     */
    private parseHeaderSection(): DXFHeader {
        const header: DXFHeader = {};

        while (this.currentIndex < this.lines.length) {
            const code = this.readCode();
            const value = this.readValue();

            if (code === 0 && value === 'ENDSEC') {
                break;
            }

            if (code === 9) {
                // 변수 이름
                const varName = value as string;
                const varCode = this.readCode();
                const varValue = this.readValue();

                header[varName] = varValue;
            }
        }

        return header;
    }

    /**
     * TABLES 섹션 파싱 (레이어 정보)
     */
    private parseTablesSection(): DXFLayerEntry[] {
        const layers: DXFLayerEntry[] = [];

        while (this.currentIndex < this.lines.length) {
            const code = this.readCode();
            const value = this.readValue();

            if (code === 0 && value === 'ENDSEC') {
                break;
            }

            if (code === 0 && value === 'LAYER') {
                const layer = this.parseLayerEntry();
                if (layer) {
                    layers.push(layer);
                }
            }
        }

        return layers;
    }

    /**
     * 레이어 엔트리 파싱
     */
    private parseLayerEntry(): DXFLayerEntry | null {
        const layer: Partial<DXFLayerEntry> = {
            name: '',
            color: 7,
            lineType: 'CONTINUOUS',
            flags: 0,
            frozen: false,
            locked: false,
        };

        while (this.currentIndex < this.lines.length) {
            const code = this.peekCode();

            if (code === 0) {
                break;
            }

            this.readCode();
            const value = this.readValue();

            switch (code) {
                case 2:
                    layer.name = value as string;
                    break;
                case 62:
                    layer.color = Math.abs(value as number);
                    break;
                case 6:
                    layer.lineType = value as string;
                    break;
                case 70:
                    layer.flags = value as number;
                    layer.frozen = ((value as number) & 1) !== 0;
                    layer.locked = ((value as number) & 4) !== 0;
                    break;
            }
        }

        return layer.name ? (layer as DXFLayerEntry) : null;
    }

    /**
     * ENTITIES 섹션 파싱
     */
    private parseEntitiesSection(): DXFEntity[] {
        const entities: DXFEntity[] = [];

        while (this.currentIndex < this.lines.length) {
            const code = this.readCode();
            const value = this.readValue();

            if (code === 0 && value === 'ENDSEC') {
                break;
            }

            if (code === 0) {
                const entity = this.parseEntity(value as string);
                if (entity) {
                    entities.push(entity);
                }
            }
        }

        return entities;
    }

    /**
     * 엔티티 파싱
     */
    private parseEntity(entityType: string): DXFEntity | null {
        switch (entityType) {
            case 'LINE':
                return this.parseLineEntity();
            case 'CIRCLE':
                return this.parseCircleEntity();
            case 'ARC':
                return this.parseArcEntity();
            case 'LWPOLYLINE':
            case 'POLYLINE':
                return this.parsePolylineEntity(entityType);
            case 'POINT':
                return this.parsePointEntity();
            case 'TEXT':
            case 'MTEXT':
                return this.parseTextEntity(entityType);
            case 'SPLINE':
                return this.parseSplineEntity();
            case 'ELLIPSE':
                return this.parseEllipseEntity();
            default:
                this.skipEntity();
                return null;
        }
    }

    /**
     * LINE 엔티티 파싱
     */
    private parseLineEntity(): DXFLine {
        const entity: DXFLine = {
            type: 'LINE',
            layer: '0',
            startX: 0,
            startY: 0,
            startZ: 0,
            endX: 0,
            endY: 0,
            endZ: 0,
        };

        while (this.currentIndex < this.lines.length) {
            const code = this.peekCode();
            if (code === 0) break;

            this.readCode();
            const value = this.readValue();

            switch (code) {
                case 8:
                    entity.layer = value as string;
                    break;
                case 62:
                    entity.color = value as number;
                    break;
                case 10:
                    entity.startX = value as number;
                    break;
                case 20:
                    entity.startY = value as number;
                    break;
                case 30:
                    entity.startZ = value as number;
                    break;
                case 11:
                    entity.endX = value as number;
                    break;
                case 21:
                    entity.endY = value as number;
                    break;
                case 31:
                    entity.endZ = value as number;
                    break;
            }
        }

        return entity;
    }

    /**
     * CIRCLE 엔티티 파싱
     */
    private parseCircleEntity(): DXFCircle {
        const entity: DXFCircle = {
            type: 'CIRCLE',
            layer: '0',
            centerX: 0,
            centerY: 0,
            centerZ: 0,
            radius: 1,
        };

        while (this.currentIndex < this.lines.length) {
            const code = this.peekCode();
            if (code === 0) break;

            this.readCode();
            const value = this.readValue();

            switch (code) {
                case 8:
                    entity.layer = value as string;
                    break;
                case 62:
                    entity.color = value as number;
                    break;
                case 10:
                    entity.centerX = value as number;
                    break;
                case 20:
                    entity.centerY = value as number;
                    break;
                case 30:
                    entity.centerZ = value as number;
                    break;
                case 40:
                    entity.radius = value as number;
                    break;
            }
        }

        return entity;
    }

    /**
     * ARC 엔티티 파싱
     */
    private parseArcEntity(): DXFArc {
        const entity: DXFArc = {
            type: 'ARC',
            layer: '0',
            centerX: 0,
            centerY: 0,
            centerZ: 0,
            radius: 1,
            startAngle: 0,
            endAngle: 360,
        };

        while (this.currentIndex < this.lines.length) {
            const code = this.peekCode();
            if (code === 0) break;

            this.readCode();
            const value = this.readValue();

            switch (code) {
                case 8:
                    entity.layer = value as string;
                    break;
                case 62:
                    entity.color = value as number;
                    break;
                case 10:
                    entity.centerX = value as number;
                    break;
                case 20:
                    entity.centerY = value as number;
                    break;
                case 30:
                    entity.centerZ = value as number;
                    break;
                case 40:
                    entity.radius = value as number;
                    break;
                case 50:
                    entity.startAngle = value as number;
                    break;
                case 51:
                    entity.endAngle = value as number;
                    break;
            }
        }

        return entity;
    }

    /**
     * POLYLINE/LWPOLYLINE 엔티티 파싱
     */
    private parsePolylineEntity(entityType: string): DXFPolyline {
        const entity: DXFPolyline = {
            type: entityType as 'LWPOLYLINE' | 'POLYLINE',
            layer: '0',
            vertices: [],
            closed: false,
        };

        let currentVertex: { x: number; y: number; z?: number; bulge?: number } | null = null;

        while (this.currentIndex < this.lines.length) {
            const code = this.peekCode();
            if (code === 0) break;

            this.readCode();
            const value = this.readValue();

            switch (code) {
                case 8:
                    entity.layer = value as string;
                    break;
                case 62:
                    entity.color = value as number;
                    break;
                case 70:
                    entity.closed = ((value as number) & 1) !== 0;
                    break;
                case 10:
                    if (currentVertex) {
                        entity.vertices.push(currentVertex);
                    }
                    currentVertex = { x: value as number, y: 0 };
                    break;
                case 20:
                    if (currentVertex) {
                        currentVertex.y = value as number;
                    }
                    break;
                case 30:
                    if (currentVertex) {
                        currentVertex.z = value as number;
                    }
                    break;
                case 42:
                    if (currentVertex) {
                        currentVertex.bulge = value as number;
                    }
                    break;
            }
        }

        if (currentVertex) {
            entity.vertices.push(currentVertex);
        }

        return entity;
    }

    /**
     * POINT 엔티티 파싱
     */
    private parsePointEntity(): DXFPoint {
        const entity: DXFPoint = {
            type: 'POINT',
            layer: '0',
            x: 0,
            y: 0,
            z: 0,
        };

        while (this.currentIndex < this.lines.length) {
            const code = this.peekCode();
            if (code === 0) break;

            this.readCode();
            const value = this.readValue();

            switch (code) {
                case 8:
                    entity.layer = value as string;
                    break;
                case 10:
                    entity.x = value as number;
                    break;
                case 20:
                    entity.y = value as number;
                    break;
                case 30:
                    entity.z = value as number;
                    break;
            }
        }

        return entity;
    }

    /**
     * TEXT/MTEXT 엔티티 파싱
     */
    private parseTextEntity(entityType: string): DXFText {
        const entity: DXFText = {
            type: entityType as 'TEXT' | 'MTEXT',
            layer: '0',
            x: 0,
            y: 0,
            z: 0,
            text: '',
            height: 1,
        };

        while (this.currentIndex < this.lines.length) {
            const code = this.peekCode();
            if (code === 0) break;

            this.readCode();
            const value = this.readValue();

            switch (code) {
                case 8:
                    entity.layer = value as string;
                    break;
                case 1:
                    entity.text = value as string;
                    break;
                case 10:
                    entity.x = value as number;
                    break;
                case 20:
                    entity.y = value as number;
                    break;
                case 30:
                    entity.z = value as number;
                    break;
                case 40:
                    entity.height = value as number;
                    break;
                case 50:
                    entity.rotation = value as number;
                    break;
            }
        }

        return entity;
    }

    /**
     * SPLINE 엔티티 파싱
     */
    private parseSplineEntity(): DXFSpline {
        const entity: DXFSpline = {
            type: 'SPLINE',
            layer: '0',
            degree: 3,
            closed: false,
            controlPoints: [],
        };

        let currentPoint: { x: number; y: number; z: number } | null = null;

        while (this.currentIndex < this.lines.length) {
            const code = this.peekCode();
            if (code === 0) break;

            this.readCode();
            const value = this.readValue();

            switch (code) {
                case 8:
                    entity.layer = value as string;
                    break;
                case 70:
                    entity.closed = ((value as number) & 1) !== 0;
                    break;
                case 71:
                    entity.degree = value as number;
                    break;
                case 10:
                    if (currentPoint) {
                        entity.controlPoints.push(currentPoint);
                    }
                    currentPoint = { x: value as number, y: 0, z: 0 };
                    break;
                case 20:
                    if (currentPoint) {
                        currentPoint.y = value as number;
                    }
                    break;
                case 30:
                    if (currentPoint) {
                        currentPoint.z = value as number;
                    }
                    break;
            }
        }

        if (currentPoint) {
            entity.controlPoints.push(currentPoint);
        }

        return entity;
    }

    /**
     * ELLIPSE 엔티티 파싱
     */
    private parseEllipseEntity(): DXFEllipse {
        const entity: DXFEllipse = {
            type: 'ELLIPSE',
            layer: '0',
            centerX: 0,
            centerY: 0,
            centerZ: 0,
            majorAxisX: 1,
            majorAxisY: 0,
            majorAxisZ: 0,
            minorAxisRatio: 0.5,
            startParam: 0,
            endParam: Math.PI * 2,
        };

        while (this.currentIndex < this.lines.length) {
            const code = this.peekCode();
            if (code === 0) break;

            this.readCode();
            const value = this.readValue();

            switch (code) {
                case 8:
                    entity.layer = value as string;
                    break;
                case 10:
                    entity.centerX = value as number;
                    break;
                case 20:
                    entity.centerY = value as number;
                    break;
                case 30:
                    entity.centerZ = value as number;
                    break;
                case 11:
                    entity.majorAxisX = value as number;
                    break;
                case 21:
                    entity.majorAxisY = value as number;
                    break;
                case 31:
                    entity.majorAxisZ = value as number;
                    break;
                case 40:
                    entity.minorAxisRatio = value as number;
                    break;
                case 41:
                    entity.startParam = value as number;
                    break;
                case 42:
                    entity.endParam = value as number;
                    break;
            }
        }

        return entity;
    }

    /**
     * 섹션 건너뛰기
     */
    private skipSection(): void {
        while (this.currentIndex < this.lines.length) {
            const code = this.readCode();
            const value = this.readValue();

            if (code === 0 && value === 'ENDSEC') {
                break;
            }
        }
    }

    /**
     * 엔티티 건너뛰기
     */
    private skipEntity(): void {
        while (this.currentIndex < this.lines.length) {
            const code = this.peekCode();
            if (code === 0) break;
            this.readCode();
            this.readValue();
        }
    }

    /**
     * 그룹 코드 읽기
     */
    private readCode(): number {
        const line = this.lines[this.currentIndex]?.trim() ?? '0';
        this.currentIndex++;
        return parseInt(line, 10);
    }

    /**
     * 값 읽기
     */
    private readValue(): string | number {
        const line = this.lines[this.currentIndex]?.trim() ?? '';
        this.currentIndex++;

        const num = parseFloat(line);
        return isNaN(num) ? line : num;
    }

    /**
     * 다음 코드 미리보기
     */
    private peekCode(): number {
        const line = this.lines[this.currentIndex]?.trim() ?? '0';
        return parseInt(line, 10);
    }

    /**
     * DXF 문서를 CADData로 변환
     */
    private convertToCADData(dxfDoc: DXFDocument, options?: ParseOptions): CADData {
        const entities: CADEntity[] = [];
        let idCounter = 0;

        for (const dxfEntity of dxfDoc.entities) {
            const cadEntity = this.convertEntity(dxfEntity, () => `entity_${idCounter++}`);
            if (cadEntity) {
                entities.push(cadEntity);
            }
        }

        const layers = this.convertLayers(dxfDoc.layers, entities);
        const bounds = this.calculateBounds(entities);
        const units = this.parseUnits(dxfDoc.header.$INSUNITS as number | undefined);

        return {
            entities,
            layers,
            bounds,
            units,
        };
    }

    /**
     * DXF 엔티티를 CAD 엔티티로 변환
     */
    private convertEntity(dxfEntity: DXFEntity, generateId: () => string): CADEntity | null {
        const id = generateId();

        switch (dxfEntity.type) {
            case 'LINE': {
                const e = dxfEntity as DXFLine;
                return {
                    id,
                    type: 'LINE',
                    layer: e.layer,
                    color: e.color,
                    start: [e.startX, e.startY, e.startZ],
                    end: [e.endX, e.endY, e.endZ],
                } as LineEntity;
            }
            case 'CIRCLE': {
                const e = dxfEntity as DXFCircle;
                return {
                    id,
                    type: 'CIRCLE',
                    layer: e.layer,
                    color: e.color,
                    center: [e.centerX, e.centerY, e.centerZ],
                    radius: e.radius,
                } as CircleEntity;
            }
            case 'ARC': {
                const e = dxfEntity as DXFArc;
                return {
                    id,
                    type: 'ARC',
                    layer: e.layer,
                    color: e.color,
                    center: [e.centerX, e.centerY, e.centerZ],
                    radius: e.radius,
                    startAngle: e.startAngle,
                    endAngle: e.endAngle,
                } as ArcEntity;
            }
            case 'LWPOLYLINE':
            case 'POLYLINE': {
                const e = dxfEntity as DXFPolyline;
                return {
                    id,
                    type: e.type,
                    layer: e.layer,
                    color: e.color,
                    vertices: e.vertices.map((v) => ({
                        position: [v.x, v.y, v.z ?? 0] as Vector3,
                        bulge: v.bulge,
                    })),
                    closed: e.closed,
                } as PolylineEntity;
            }
            case 'POINT': {
                const e = dxfEntity as DXFPoint;
                return {
                    id,
                    type: 'POINT',
                    layer: e.layer,
                    color: e.color,
                    position: [e.x, e.y, e.z],
                } as PointEntity;
            }
            case 'TEXT':
            case 'MTEXT': {
                const e = dxfEntity as DXFText;
                return {
                    id,
                    type: e.type,
                    layer: e.layer,
                    color: e.color,
                    position: [e.x, e.y, e.z],
                    text: e.text,
                    height: e.height,
                    rotation: e.rotation,
                } as TextEntity;
            }
            case 'SPLINE': {
                const e = dxfEntity as DXFSpline;
                return {
                    id,
                    type: 'SPLINE',
                    layer: e.layer,
                    color: e.color,
                    controlPoints: e.controlPoints.map((p) => [p.x, p.y, p.z] as Vector3),
                    degree: e.degree,
                    closed: e.closed,
                } as SplineEntity;
            }
            case 'ELLIPSE': {
                const e = dxfEntity as DXFEllipse;
                return {
                    id,
                    type: 'ELLIPSE',
                    layer: e.layer,
                    color: e.color,
                    center: [e.centerX, e.centerY, e.centerZ],
                    majorAxis: [e.majorAxisX, e.majorAxisY, e.majorAxisZ],
                    minorAxisRatio: e.minorAxisRatio,
                    startAngle: e.startParam,
                    endAngle: e.endParam,
                } as EllipseEntity;
            }
            default:
                return null;
        }
    }

    /**
     * 레이어 변환
     */
    private convertLayers(dxfLayers: DXFLayerEntry[], entities: CADEntity[]): CADLayer[] {
        const layerMap = new Map<string, CADLayer>();

        // DXF 레이어 변환
        for (const dxfLayer of dxfLayers) {
            layerMap.set(dxfLayer.name, {
                name: dxfLayer.name,
                color: dxfLayer.color,
                visible: !dxfLayer.frozen,
                frozen: dxfLayer.frozen,
                locked: dxfLayer.locked,
            });
        }

        // 엔티티에서 사용된 레이어 추가
        for (const entity of entities) {
            if (!layerMap.has(entity.layer)) {
                layerMap.set(entity.layer, {
                    name: entity.layer,
                    color: 7,
                    visible: true,
                    frozen: false,
                    locked: false,
                });
            }
        }

        return Array.from(layerMap.values());
    }

    /**
     * 바운딩 박스 계산
     */
    private calculateBounds(entities: CADEntity[]): BoundingBox {
        const min: Vector3 = [Infinity, Infinity, Infinity];
        const max: Vector3 = [-Infinity, -Infinity, -Infinity];

        const updateBounds = (point: Vector3) => {
            min[0] = Math.min(min[0], point[0]);
            min[1] = Math.min(min[1], point[1]);
            min[2] = Math.min(min[2], point[2]);
            max[0] = Math.max(max[0], point[0]);
            max[1] = Math.max(max[1], point[1]);
            max[2] = Math.max(max[2], point[2]);
        };

        for (const entity of entities) {
            switch (entity.type) {
                case 'LINE': {
                    const e = entity as LineEntity;
                    updateBounds(e.start);
                    updateBounds(e.end);
                    break;
                }
                case 'CIRCLE': {
                    const e = entity as CircleEntity;
                    updateBounds([e.center[0] - e.radius, e.center[1] - e.radius, e.center[2]]);
                    updateBounds([e.center[0] + e.radius, e.center[1] + e.radius, e.center[2]]);
                    break;
                }
                case 'ARC': {
                    const e = entity as ArcEntity;
                    updateBounds([e.center[0] - e.radius, e.center[1] - e.radius, e.center[2]]);
                    updateBounds([e.center[0] + e.radius, e.center[1] + e.radius, e.center[2]]);
                    break;
                }
                case 'POLYLINE':
                case 'LWPOLYLINE': {
                    const e = entity as PolylineEntity;
                    for (const v of e.vertices) {
                        updateBounds(v.position);
                    }
                    break;
                }
                case 'POINT': {
                    const e = entity as PointEntity;
                    updateBounds(e.position);
                    break;
                }
                case 'TEXT':
                case 'MTEXT': {
                    const e = entity as TextEntity;
                    updateBounds(e.position);
                    break;
                }
                case 'SPLINE': {
                    const e = entity as SplineEntity;
                    for (const cp of e.controlPoints) {
                        updateBounds(cp);
                    }
                    break;
                }
                case 'ELLIPSE': {
                    const e = entity as EllipseEntity;
                    const majorLen = Math.sqrt(
                        e.majorAxis[0] ** 2 + e.majorAxis[1] ** 2 + e.majorAxis[2] ** 2
                    );
                    updateBounds([e.center[0] - majorLen, e.center[1] - majorLen, e.center[2]]);
                    updateBounds([e.center[0] + majorLen, e.center[1] + majorLen, e.center[2]]);
                    break;
                }
            }
        }

        // 엔티티가 없는 경우 기본값
        if (entities.length === 0) {
            return {
                min: [0, 0, 0],
                max: [0, 0, 0],
            };
        }

        return { min, max };
    }

    /**
     * 단위 파싱
     */
    private parseUnits(insunits?: number): CADUnit {
        switch (insunits) {
            case 1:
                return 'inch';
            case 2:
                return 'ft';
            case 4:
                return 'mm';
            case 5:
                return 'cm';
            case 6:
                return 'm';
            default:
                return 'mm';
        }
    }
}

// 싱글톤 인스턴스
export const dxfParser = new DxfParser();
