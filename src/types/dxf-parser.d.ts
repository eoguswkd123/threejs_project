/**
 * Type definitions for dxf-parser
 * DXF 파일 파싱 라이브러리 타입 정의
 */

declare module 'dxf-parser' {
    interface DXFPoint {
        x: number;
        y: number;
        z?: number;
    }

    interface DXFEntity {
        type: string;
        handle?: string;
        layer?: string;
        colorIndex?: number;
        color?: number;
        lineType?: string;
        lineTypeScale?: number;
    }

    interface DXFLineEntity extends DXFEntity {
        type: 'LINE';
        vertices?: [DXFPoint, DXFPoint];
        start?: DXFPoint;
        end?: DXFPoint;
    }

    interface DXFCircleEntity extends DXFEntity {
        type: 'CIRCLE';
        center: DXFPoint;
        radius: number;
    }

    interface DXFArcEntity extends DXFEntity {
        type: 'ARC';
        center: DXFPoint;
        radius: number;
        startAngle: number;
        endAngle: number;
    }

    interface DXFPolylineEntity extends DXFEntity {
        type: 'LWPOLYLINE' | 'POLYLINE';
        vertices: DXFPoint[];
        shape: boolean;
    }

    interface DXFLayer {
        name: string;
        color: number;
        colorIndex?: number;
        frozen?: boolean;
        visible?: boolean;
    }

    interface DXFHeader {
        $ACADVER?: string;
        $INSUNITS?: number;
        $EXTMIN?: DXFPoint;
        $EXTMAX?: DXFPoint;
        [key: string]: any;
    }

    interface DXFTables {
        layer?: { [name: string]: DXFLayer };
        [key: string]: any;
    }

    interface DXFBlock {
        name: string;
        layer: string;
        position: DXFPoint;
        entities: DXFEntity[];
    }

    interface ParsedDXF {
        header?: DXFHeader;
        tables?: DXFTables;
        blocks?: { [name: string]: DXFBlock };
        entities: DXFEntity[];
    }

    class DxfParser {
        parseSync(content: string): ParsedDXF;
        parse(
            content: string,
            done: (error: Error | null, dxf: ParsedDXF | null) => void
        ): void;
    }

    export = DxfParser;
}
