var moduleBase;
var GUObjectArray;
var GName;

var nameIds = [];
var platform = Process.platform

// Global
var FUObjectItemPadd = 0x0;
var FUObjectItemSize = 0x18;
// SDK
var offset_FUObjectArray_TUObjectArray = 0x10;
var offset_TUObjectArray_NumElements = 0x14;
// FNamePool
var FNameStride = 0x2
var offset_GName_FNamePool = platform == "linux" ? 0x30 : 0xc0;
var offset_FNamePool_CurrentBlock = 0x8;
var offset_FNamePool_CurrentByteCursor = 0xc;
var offset_FNamePool_Blocks = 0x10;
// FNameEntry
var FNameEntry_LenBit = 6;
var offset_FNameEntryT_String = 0x2;
//Class: UObject
var offset_UObject_InternalIndex = 0xC;
var offset_UObject_ClassPrivate = 0x10;
var offset_UObject_FNameIndex = 0x18;
var offset_UObject_OuterPrivate = 0x20;
//Class: UField
var offset_offset_UField_Next = 0x28;
//Class: UStruct
var offset_UStruct_SuperStruct = 0x40;
var offset_UStruct_Children = 0x48;
var offset_UStruct_ChildProperties = 0x50;
//Class: FField
var offset_FField_Class = 0x8;
var offset_FField_Next = 0x20;
var offset_FField_Name = 0x28;
//Class: UFunction
var offset_UFunction_FunctionFlags = 0xb0;
var offset_UFunction_Func = 0xd8;
//Class: UProperty
var offset_UProperty_ElementSize = 0x38;
var offset_UProperty_PropertyFlags = 0x40;
var offset_UProperty_OffsetInternal = 0x4c;
//Class: UBoolProperty
var offset_UBoolProperty_FieldSize = 0x88;
var offset_UBoolProperty_ByteOffset = 0x89;
var offset_UBoolProperty_ByteMask = 0x8a;
var offset_UBoolProperty_FieldMask = 0x8b;
//Class: UObjectProperty
var offset_UObjectProperty_PropertyClass = 0x78;
//Class: UClassProperty
var offset_UClassProperty_MetaClass = 0x78;
//Class: UInterfaceProperty
var offset_UInterfaceProperty_InterfaceClass = 0x78;
//Class: UArrayProperty
var offset_UArrayProperty_InnerProperty = 0x78;
//Class: UMapProperty
var offset_UMapProperty_KeyProp = 0x78;
var offset_UMapProperty_ValueProp = 0x80;
//Class: USetProperty
var offset_USetProperty_ElementProp = 0x78;
//Class: UStructProperty
var offset_UStructProperty_Struct = 0x78;
//Class: UWorld
var offset_UWorld_PersistentLevel = 0x30;
//Class: ULevel
var offset_ULevel_AActors = 0x98;
var offset_ULevel_AActorsCount = 0xA0;

var UObject = {
    getClass: function(obj) {
        var classPrivate = ptr(obj).add(offset_UObject_ClassPrivate).readPointer();
        // console.log(`classPrivate: ${classPrivate}`);
        return classPrivate;
    },
    getNameId: function(obj) {
        var nameId = ptr(obj).add(offset_UObject_FNameIndex).readU32();
        // console.log(`nameId: ${nameId}`);
        return nameId;
    },
    getName: function(obj) {
        if (this.isValid(obj)){
            return getFNameFromID(this.getNameId(obj));
        } else {
            return "None";
        }
    },
    getClassName: function(obj) {
        if (this.isValid(obj)) {
            var classPrivate = this.getClass(obj);
            return this.getName(classPrivate);
        } else {
            return "None";
        }
    },
    isValid: function(obj) {
        var isValid = (ptr(obj) > 0 && this.getNameId(obj) > 0 && this.getClass(obj) > 0);
        // console.log(`isValid: ${isValid}`);
        return isValid;
    }
}

var UField = {
    getNext: function(field) {//UField*
        return field.add(offset_offset_UField_Next).readPointer();
    }
};

var FField = {
    getName: function(fField) {
        return getFNameFromID(fField.add(offset_FField_Name).readU32());
    },
    getClassName: function(fField) {
        return getFNameFromID(fField.add(offset_FField_Class).readPointer().readU32());
    },
    getNext: function(fField) {//UField*
        return fField.add(offset_FField_Next).readPointer();
    }
};

var UStruct = {
    getSuperClass: function(structz) {//UStruct*
        // console.log(`structz: ${structz}`);
        return structz.add(offset_UStruct_SuperStruct).readPointer()
    },
    getChildren: function(structz) {//UField*
        return structz.add(offset_UStruct_Children).readPointer();
    },
    getChildProperties: function(structz) {//UField*
        return structz.add(offset_UStruct_ChildProperties).readPointer();
    },
    getClassName: function(clazz) {
        return UObject.getName(clazz);
    },
    getClassPath: function(object) {
        var clazz = UObject.getClass(object);
        var classname = UObject.getName(clazz);

        var superclass = this.getSuperClass(clazz);
        while (UObject.isValid(superclass)) {
            classname += ".";
            classname += UObject.getName(superclass);

            superclass = this.getSuperClass(superclass);
        }

        return classname;
    },
    getStructClassPath: function(clazz) {
        var classname = UObject.getName(clazz);

        var superclass = this.getSuperClass(clazz);
        while (UObject.isValid(superclass)) {
            // console.log(`superclass: ${superclass}`)
            classname += ".";
            classname += UObject.getName(superclass);

            superclass = this.getSuperClass(superclass);
        }

        return classname;
    }
}

var UFunction = {
    getFunctionFlags: function(func) {
        return func.add(offset_UFunction_FunctionFlags).readU32();
    },
    getFunc: function(func) {
        return func.add(offset_UFunction_Func).readPointer();
    }
};

var UProperty = {
    getElementSize: function(prop) {
        return prop.add(offset_UProperty_ElementSize).readU32();
    },
    getPropertyFlags: function(prop) {
        return prop.add(offset_UProperty_PropertyFlags).readU64()
    },
    getOffset: function(prop) {
        return prop.add(offset_UProperty_OffsetInternal).readU32();
    }
};

var UBoolProperty = {
    getFieldSize: function(prop) {
        return prop.add(offset_UBoolProperty_FieldSize).readU8();
    },
    getByteOffset: function(prop) {
        return prop.add(offset_UBoolProperty_ByteOffset).readU8();
    },
    getByteMask: function(prop) {
        return prop.add(offset_UBoolProperty_ByteMask).readU8();
    },
    getFieldMask: function(prop) {
        return prop.add(offset_UBoolProperty_FieldMask).readU8();
    },
};

var UObjectProperty = {
    getPropertyClass: function(prop) {//class UClass*
        return prop.add(offset_UObjectProperty_PropertyClass).readPointer();
    }
};

var UClassProperty = {
    getMetaClass: function(prop) {//class UClass*
        return prop.add(offset_UClassProperty_MetaClass).readPointer();
    }
};

var UInterfaceProperty = {
    getInterfaceClass: function(prop) {//class UClass*
        return prop.add(offset_UInterfaceProperty_InterfaceClass).readPointer();
    }
};

var UArrayProperty = {
    getInner: function(prop) {//UProperty*
        return prop.add(offset_UArrayProperty_InnerProperty).readPointer();
    }
};

var UMapProperty = {
    getKeyProp: function(prop) {//UProperty*
        return prop.add(offset_UMapProperty_KeyProp).readPointer();
    },
    getValueProp: function(prop) {//UProperty*
        return prop.add(offset_UMapProperty_ValueProp).readPointer();
    }
};

var USetProperty = {
    getElementProp: function(prop) {//UProperty*
        return prop.add(offset_USetProperty_ElementProp).readPointer();
    }
};

var UStructProperty = {
    getStruct: function(prop) {//UStruct*
        return prop.add(offset_UStructProperty_Struct).readPointer();
    }
};

function getFNameFromID(index) {
    var Block = index >> 16;
    var Offset = index & 65535;

    var FNamePool = GName.add(offset_GName_FNamePool);
    // console.log(`FNamePool: ${FNamePool}`);
    // console.log(`Block: ${Block}`);
    var NamePoolChunk = FNamePool.add(offset_FNamePool_Blocks + Block * Process.pointerSize).readPointer();
    // console.log(`NamePoolChunk: ${NamePoolChunk}`);
    var FNameEntry = NamePoolChunk.add(FNameStride * Offset);
    // console.log(`FNameEntry: ${FNameEntry}`);
    var FNameEntryHeader = FNameEntry.readU16();
    // console.log(`FNameEntryHeader: ${FNameEntryHeader}`);
    var str_addr = FNameEntry.add(offset_FNameEntryT_String);
    var str_length = FNameEntryHeader >> FNameEntry_LenBit;
    var wide = FNameEntryHeader & 1;

    if (str_length > 0 && str_length < 250) {
        var str = str_addr.readUtf8String(str_length);
        return str;
    } else {
        return "None";
    }
}

function getUObjectBaseObjectFromId(index) {
    var TUObjectArray = GUObjectArray.add(offset_FUObjectArray_TUObjectArray).readPointer();
    // console.log(`TUObjectArray: ${TUObjectArray}`)
    var chunk = TUObjectArray.add(parseInt(index / 0x10000) * Process.pointerSize);
    var FUObjectItemObjects = chunk.readPointer();
    // console.log(`FUObjectItemObjects: ${FUObjectItemObjects}`);
    var UObjectBaseObject = FUObjectItemObjects.add(FUObjectItemPadd + (index % 0x10000) * FUObjectItemSize).readPointer();
    // console.log(`UObjectBaseObject: ${UObjectBaseObject}`);
    return UObjectBaseObject;
}

function resolveProp(recurrce, prop) {
    if (prop) {
        var cname = FField.getClassName(prop);
        // console.log(`resolveProp cname: ${cname}`);

        if (cname === "ObjectProperty" || cname === "WeakObjectProperty"
            || cname === "LazyObjectProperty" || cname === "AssetObjectProperty"
            || cname === "SoftObjectProperty") {
            var propertyClass = UObjectProperty.getPropertyClass(prop);
            recurrce.push(...[propertyClass]);
            return UObject.getName(propertyClass) + "*";
        } else if (cname === "ClassProperty" || cname === "AssetClassProperty" ||
                   cname === "SoftClassProperty") {
            var metaClass = UClassProperty.getMetaClass(prop);
            recurrce.push(...[metaClass]);
            return "class " + UObject.getName(metaClass);
        } else if (cname === "InterfaceProperty") {
            var interfaceClass = UInterfaceProperty.getInterfaceClass(prop);
            recurrce.push(...[interfaceClass]);
            return "interface class" + UObject.getName(interfaceClass);
        } else if (cname === "StructProperty") {
            var Struct = UStructProperty.getStruct(prop);
            // console.log(`StructProperty addr: ${Struct}`);
            // return "None";
            // return UObject.getName(Struct);
            // if(UObject.isValid(Struct)){
            recurrce.push(...[Struct]);
            return UObject.getName(Struct);
            // } else {
            //     return "None";
            // }
        } else if (cname === "ArrayProperty") {
            return resolveProp(recurrce, UArrayProperty.getInner(prop)) + "[]";
        } else if (cname === "SetProperty") {
            return "<" + resolveProp(recurrce, USetProperty.getElementProp(prop)) + ">";
        } else if (cname === "MapProperty") {
            return "<" + resolveProp(recurrce, UMapProperty.getKeyProp(prop)) + "," +
                   resolveProp(recurrce, UMapProperty.getValueProp(prop)) + ">";
        } else if (cname === "BoolProperty") {
            return "bool";
        } else if (cname === "ByteProperty") {
            return "byte";
        } else if (cname === "IntProperty") {
            return "int";
        } else if (cname === "Int8Property") {
            return "int8";
        } else if (cname === "Int16Property") {
            return "int16";
        } else if (cname === "Int64Property") {
            return "int64";
        } else if (cname === "UInt16Property") {
            return "uint16";
        } else if (cname === "UInt32Property") {
            return "uint32";
        } else if (cname === "UInt64Property") {
            return "uint64";
        } else if (cname === "DoubleProperty") {
            return "double";
        } else if (cname === "FloatProperty") {
            return "float";
        } else if (cname === "EnumProperty") {
            return "enum";
        } else if (cname === "StrProperty") {
            return "FString";
        } else if (cname === "TextProperty") {
            return "FText";
        } else if (cname === "NameProperty") {
            return "FName";
        } else if (cname === "DelegateProperty" || cname === "MulticastDelegateProperty") {
            return "delegate";
        } else {
            return FField.getName(prop) + "(" + cname + ")";
        }
    }
    return "NULL";
}

function writeStructChild(childprop) {
    var recurrce = [];
    var child = childprop;
    while (UObject.isValid(child)) {
        var prop = child;
        var oname = FField.getName(prop);
        var cname = FField.getClassName(prop);
        // console.log(`oname: ${oname}, cname: ${cname}`);
        if (cname === "ObjectProperty" || cname === "WeakObjectProperty" || cname === "LazyObjectProperty" || cname === "AssetObjectProperty" || cname === "SoftObjectProperty") {
            var propertyClass = UObjectProperty.getPropertyClass(prop);
            console.log(`\t${UObject.getName(propertyClass)}* ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
            recurrce.push(propertyClass);
        } else if (cname === "ClassProperty" || cname === "AssetClassProperty" || cname === "SoftClassProperty") {
            var metaClass = UClassProperty.getMetaClass(prop);
            console.log(`\tclass ${UObject.getName(metaClass)}* ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
            recurrce.push(metaClass);
        } else if (cname === "InterfaceProperty") {
            var interfaceClass = UInterfaceProperty.getInterfaceClass(prop);
            console.log(`\tinterface class ${UObject.getName(interfaceClass)}* ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`)
        } else if (cname === "StructProperty") {
            var Struct = UStructProperty.getStruct(prop);
            console.log(`\t${UObject.getName(Struct)} ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
            recurrce.push(Struct);
        } else if (cname === "ArrayProperty") {
            console.log(`\t${resolveProp(recurrce, UArrayProperty.getInner(prop))}[] ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "SetProperty") {
            console.log(`\t${resolveProp(recurrce, USetProperty.getElementProp(prop))} ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "MapProperty") {
            console.log(`\t${resolveProp(recurrce, UMapProperty.getKeyProp(prop))}, ${resolveProp(recurrce, UMapProperty.getValueProp(prop))}> ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "BoolProperty") {
            console.log(`\tbool ${oname} //(ByteOffset: ${ptr(UBoolProperty.getByteOffset(prop))}, ByteMask: ${UBoolProperty.getByteMask(prop)}, FieldMask: ${UBoolProperty.getFieldMask(prop)}) [Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "ByteProperty") {
            console.log(`\tbyte ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "IntProperty") {
            console.log(`\tint ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "Int8Property") {
            console.log(`\tint8 ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "Int16Property") {
            console.log(`\tint16 ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "Int64Property") {
            console.log(`\tint64 ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "UInt16Property") {
            console.log(`\tint16 ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "UInt32Property") {
            console.log(`\tint32 ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "UInt64Property") {
            console.log(`\tint64 ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "DoubleProperty") {
            console.log(`\tdouble ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "FloatProperty") {
            console.log(`\tfloat ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "EnumProperty") {
            console.log(`\tenum ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "StrProperty") {
            console.log(`\tFString ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "TextProperty") {
            console.log(`\tFText ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "NameProperty") {
            console.log(`\tFName ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "DelegateProperty" || cname === "MulticastDelegateProperty" || cname === "MulticastInlineDelegateProperty" || cname === "MulticastSparseDelegateProperty") {
            console.log(`\tdelegate ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else if (cname === "XigPtrProperty") {
            console.log(`\tXigPtrProperty ${oname}; //[Offset: ${ptr(UProperty.getOffset(prop))}, Size: ${UProperty.getElementSize(prop)}]`);
        } else {
            console.log(`\t${cname} ${oname}; //[Size: ${UProperty.getElementSize(prop)}]`);
        }

        child = FField.getNext(child);
    }
    return recurrce;
}

function writeStructChild_Func(childprop) {
    var recurrce = [];
    var child = childprop;
    // console.log(`child: ${child}`);
    while (UObject.isValid(child)) {
        var prop = child;
        var oname = UObject.getName(prop);
        var cname = UObject.getClassName(prop);

        if (cname.startsWith("Function") || cname === "DelegateFunction") {
            var returnVal = "void";
            var params = "";

            var funcParam = UStruct.getChildProperties(prop);
            // console.log(`funcParam: ${funcParam});
            while (UObject.isValid(funcParam)) {
                var PropertyFlags = UProperty.getPropertyFlags(funcParam);
                // console.log(`PropertyFlags: ${PropertyFlags});
                if ((PropertyFlags & 0x0000000000000400) == 0x0000000000000400) {
                    returnVal = resolveProp(recurrce, funcParam);
                } else {
                    if ((PropertyFlags & 0x0000000000000100) == 0x0000000000000100) {
                        params += "out ";
                    }
                    /*if((PropertyFlags & 0x0000000008000000) == 0x0000000008000000){
                        params += "ref ";
                    }*/
                    if ((PropertyFlags & 0x0000000000000002) == 0x0000000000000002) {
                        params += "const ";
                    }
                    // console.log(`funcParam will go in...: ${funcParam});
                    params += resolveProp(recurrce, funcParam);
                    // params += "blahblah";
                    params += " ";
                    params += FField.getName(funcParam);
                    params += ", ";
                }

                funcParam = FField.getNext(funcParam);
            }

            if (params.length > 0) {
                params = params.slice(0, -2);
            }

            var FunctionFlags = UFunction.getFunctionFlags(prop);
            // console.log(`FunctionFlags: ${FunctionFlags});

            if ((FunctionFlags & 0x00002000) == 0x00002000) {
                returnVal = "static " + returnVal;
            }
            /*if((FunctionFlags & 0x00000001) == 0x00000001){
                returnVal = "final " + returnVal;
            }
            if((FunctionFlags & 0x00020000) == 0x00020000){
                returnVal = "public " + returnVal;
            }
            if((FunctionFlags & 0x00040000) == 0x00040000){
                returnVal = "private " + returnVal;
            }
            if((FunctionFlags & 0x00080000) == 0x00080000){
                returnVal = "protected " + returnVal;
            }*/

            console.log(`\t${returnVal} ${oname}(${params}); // ${ptr(UFunction.getFunc(prop) - moduleBase)}`);
        } else {
            console.log(`\t${cname} ${oname}; //[Size: ${UProperty.getElementSize(prop)}]`); 
        }

        child = UField.getNext(child);
    }
    return recurrce;
}

function writeStruct(clazz) {
    var recurrce = [];

    var currStruct = clazz;
    while (UObject.isValid(currStruct)) {
        // console.log(`currStruct: ${currStruct}`)
        var name = UObject.getName(currStruct);
        // console.log(`name: ${name}`);
        if (name === "None" || name.indexOf("/Game/") > -1 || name.indexOf("_png") > -1 || name === "") {
            // console.log(`name is ${name} gonna break`);
            break;
        }

        var nameId = UObject.getNameId(currStruct);
        // console.log(nameId);
        if (!nameIds.includes(nameId)) {
            nameIds.push(nameId);
            console.log(`Class: ${UStruct.getStructClassPath(currStruct)}`)
            recurrce.push(...writeStructChild(UStruct.getChildProperties(currStruct)));
            recurrce.push(...writeStructChild_Func(UStruct.getChildren(currStruct)));
        }
        currStruct = UStruct.getSuperClass(currStruct);
    }
    // console.log(`recurse: ${recurrce}`);
    for (var item in recurrce) {
        writeStruct(recurrce[item]);
    }
}

function dumpObjects() {
    if (GUObjectArray === undefined) {
        console.log(`Do set(<moduleName>) first`);
        return;
    } else if (GUObjectArray === null) {
        console.log(`Provide GUObjectArray address by GUObjectArray = moduleBase.add(<offset of GUObjectArray>);`);
        return;
    }
    var ObjectCount = GUObjectArray.add(offset_FUObjectArray_TUObjectArray).add(offset_TUObjectArray_NumElements).readU32();
    console.log(`ObjectCount: ${ObjectCount}`);

    for (var i = 0; i < ObjectCount; i++) {
        var UObjectBaseObject = getUObjectBaseObjectFromId(i);
        if (UObject.isValid(UObjectBaseObject)) {
            var name = UObject.getName(UObjectBaseObject);
            console.log(`${i}. name: ${name}`);
            var className = UObject.getClassName(UObjectBaseObject);
            console.log(`${i}. class: ${className}`);
        }
    }
}

function dumpSdk() {
    if (GUObjectArray === undefined) {
        console.log(`Do set(<moduleName>) first`);
        return;
    } else if (GUObjectArray === null) {
        console.log(`Provide GUObjectArray address by GUObjectArray = moduleBase.add(<offset of GUObjectArray>);`);
        return;
    }
    var ObjectCount = GUObjectArray.add(offset_FUObjectArray_TUObjectArray).add(offset_TUObjectArray_NumElements).readU32();
    
    for (var i = 0; i < ObjectCount; i++) {
        var UObjectBaseObject = getUObjectBaseObjectFromId(i);
        // console.log(`UObjectBaseObject: ${UObjectBaseObject}`);
        if (UObject.isValid(UObjectBaseObject)) {
            var clazz = UObject.getClass(UObjectBaseObject);
            writeStruct(clazz);
        }
    }
}

// Find GName
function findGName(moduleName) {
    var addr = Module.findExportByName(moduleName, "_Zeq12FNameEntryId5EName");
    if (addr === null) {
        console.log(`[!] Cannot find GName`);
        console.log(`[*] Try to search GName on memory`);
        var module = Process.findModuleByName(moduleName)
        // Pattern for _Zeq12FNameEntryId5EName func (operator==(FNameEntryId, EName))
        var pattern = "28 ?? ?? ?? 08 01 ?? 91 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? 08 69 69 b8 1f 01 00 6b e0 17 9f 1a c0 03 5f d6";
        var match = Memory.scanSync(module.base, module.size, pattern);
        if (match.length > 0) {
            console.log(`[*] Found _Zeq12FNameEntryId5EName function address ${match[0].address}`);
            console.log(`[*] Intercept _Zeq12FNameEntryId5EName to get GName`);
            addr = match[0].address;
        } else {
            console.log(`[!] Cannot find GName in memory too. You need to find it by yourself`);
            GName = null;
            return;
        }
    } 

    // Intercept operator==(FNameEntryId, EName) func
    Interceptor.attach(addr.add(0x8), {
        onEnter: function(args) {
            // console.log(this.context.x8);
            // console.log(JSON.stringify(this.context.x8).length);
            if (this.context.x8 != ptr(0x0) && JSON.stringify(this.context.x8).length > 10) {
                GName = ptr(this.context.x8);
                Interceptor.detachAll();
            }
        },
        onLeave: function(retval) {
            // Interceptor.detachAll();
        }
    })
}

function set(moduleName) {
    moduleBase = Module.findBaseAddress(moduleName);
    GUObjectArray = Module.findExportByName(moduleName, "GUObjectArray");
    if (GUObjectArray === null) {
        console.log(`[!] Cannot find GUObjectArray. You need to find it by yourself`);
    }
    findGName(moduleName);

    var int = setInterval(() => {
        if (GName !== undefined && GName !== null) {
            console.log(`\n[*] set ${moduleName} base: ${moduleBase}, GUObjectArray: ${GUObjectArray}, GName: ${GName}`);
            clearInterval(int);
            return;
        } else if (GName === null) {
            console.log(`\n[*] set ${moduleName} base: ${moduleBase}, GUObjectArray: ${GUObjectArray}, GName: ${GName}`);
            clearInterval(int);
            return;
        }
    }, 0);
}
