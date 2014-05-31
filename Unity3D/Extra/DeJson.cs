/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using MiniJSON;

namespace DeJson {

public class Deserializer {

    /// <summary>
    /// A Class used to direct which class to make when it's not obvious, like if you have a class
    /// with a member that's a base class but the actual class could be one of many derived classes.
    /// </summary>
    public abstract class CustomCreator {

        /// <summary>
        /// Creates an new derived class when a base is expected
        /// </summary>
        /// <param name="src">A dictionary of the json fields that belong to the object to be created.</param>
        /// <param name="parentSrc">A dictionary of the json fields that belong to the object that is the parent of the object to be created.</param>
        /// <example>
        /// Example: Assume you have the following classes
        /// <code>
        ///     class Fruit { public int type; }
        ///     class Apple : Fruit { public float height; public float radius; };
        ///     class Raspberry : Fruit { public int numBulbs; }
        /// </code>
        /// You'd register a dervied CustomCreator for type `Fruit`. When the Deserialize needs to create
        /// a `Fruit` it will call your Create function. Using `src` you could look at `type` and
        /// decide whether to make an Apple or a Raspberry.
        /// <code>
        ///     int type = src["type"];
        ///     if (type == 0) { return new Apple; }
        ///     if (type == 1) { return new Raspberry; }
        ///     ..
        /// </code>
        /// If the parent has info on the type you can do this
        /// <code>
        ///     class Fruit { }
        ///     class Apple : Fruit { public float height; public float radius; };
        ///     class Raspberry : Fruit { public int numBulbs; }
        ///     class Basket { public int typeInBasket; Fruit fruit; }
        /// </code>
        /// In this case again, when trying to create a `Fruit` your CustomCreator.Create function
        /// will be called. You can use `'parentSrc`' to look at the fields from 'Basket' as in
        /// <code>
        ///     int typeInBasket = parentSrc['typeInBasket'];
        ///     if (type == 0) { return new Apple; }
        ///     if (type == 1) { return new Raspberry; }
        ///     ..
        /// </code>
        /// </example>
        /// <returns>The created object</returns>
        public abstract object Create(Dictionary<string, object> src, Dictionary<string, object> parentSrc);

        /// <summary>
        /// The base type this CustomCreator makes.
        /// </summary>
        /// <returns>The type this CustomCreator makes.</returns>
        public abstract System.Type TypeToCreate();
    }

    /// <summary>
    /// Deserializer for Json to your classes.
    /// </summary>
    public Deserializer() {
        m_creators = new Dictionary<System.Type, CustomCreator>();
    }

    /// <summary>
    /// Deserializes a json string into classes.
    /// </summary>
    /// <param name="json">String containing JSON</param>
    /// <param name="includeTypeInfoForDerviedTypes">Default false</param>
    /// <returns>An instance of class T.</returns>
    /// <example>
    /// <code>
    ///     public class Foo {
    ///         public int num;
    ///         public string name;
    ///         public float weight;
    ///     };
    ///
    ///     public class Bar {
    ///         public int hp;
    ///         public Foo someFoo;
    ///     };
    /// ...
    ///     Deserializer deserializer = new Deserializer();
    ///
    ///     string json = "{\"hp\":123,\"someFoo\":{\"num\":456,\"name\":\"gman\",\"weight\":156.4}}";
    ///
    ///     Bar bar = deserializer.Deserialize<Bar>(json);
    ///
    ///     print("bar.hp: " + bar.hp);
    ///     print("bar.someFoo.num: " + bar.someFoo.num);
    ///     print("bar.someFoo.name: " + bar.someFoo.name);
    ///     print("bar.someFoo.weight: " + bar.someFoo.weight);
    ///
    /// </code>
    /// </example>
    public T Deserialize<T>(string json) {
        object o = Json.Deserialize(json);
        return Deserialize<T>(o);
    }

    public T Deserialize<T>(object o) {
        return (T)ConvertToType(o, typeof(T), null);
    }

    /// <summary>
    /// Registers a CustomCreator.
    /// </summary>
    /// <param name="creator">The creator to register</param>
    public void RegisterCreator(CustomCreator creator) {
        System.Type t = creator.TypeToCreate();
        m_creators[t] = creator;
    }

    private object DeserializeO(Type destType, Dictionary<string, object> src, Dictionary<string, object> parentSrc) {
        object dest = null;

        // This seems like a hack but for now maybe it's the right thing?
        // Basically if the thing you want is a Dictionary<stirng, object>
        // Then just give it do you since that's the source. No need
        // to try to copy it.
        if (destType == typeof(Dictionary<string, object>)) {
            return src;
        }

        // First see if there is a CustomCreator for this type.
        CustomCreator creator;
        if (m_creators.TryGetValue(destType, out creator)) {
            dest = creator.Create(src, parentSrc);
        }

        if (dest == null) {
            // Check if there is a type serialized for this
            object typeNameObject;
            if (src.TryGetValue("$dotNetType", out typeNameObject)) {
                destType =System.Type.GetType((string)typeNameObject);
            }
            dest = Activator.CreateInstance(destType);
        }

        DeserializeIt(dest, src);
        return dest;
    }

    private void DeserializeIt(object dest, Dictionary<string, object> src) {
        System.Type type = dest.GetType();
        System.Reflection.FieldInfo[] fields = type.GetFields();

        DeserializeClassFields(dest, fields, src);
    }

    private void DeserializeClassFields(object dest, System.Reflection.FieldInfo[] fields, Dictionary<string, object> src) {
        foreach (System.Reflection.FieldInfo info in fields) {
            object value;
            if (src.TryGetValue(info.Name, out value)) {
                DeserializeField(dest, info, value, src);
            }
        }
    }

    private void DeserializeField(object dest, System.Reflection.FieldInfo info, object value, Dictionary<string, object> src) {
        Type fieldType = info.FieldType;
        object o = ConvertToType(value, fieldType, src);
        info.SetValue(dest, o);
    }

    private object ConvertToType(object value, System.Type type, Dictionary<string, object> src) {
        if (type.IsArray) {
            return ConvertToArray(value, type, src);
        } else if (type == typeof(string)) {
            return Convert.ToString(value);
        } else if (type == typeof(int)) {
            return Convert.ToInt32(value);
        } else if (type == typeof(float)) {
            return Convert.ToSingle(value);
        } else if (type == typeof(double)) {
            return Convert.ToDouble(value);
        } else if (type == typeof(bool)) {
            return Convert.ToBoolean(value);
        } else if (type.IsClass) {
            return DeserializeO(type, (Dictionary<string, object>)value, src);
        } else {
            // Should we throw here?
        }
        return value;
    }

    private object ConvertToArray(object value, System.Type type, Dictionary<string, object> src) {
        List<object> elements = (List<object>)value;
        int numElements = elements.Count;
        Type elementType = type.GetElementType();
        Array array = Array.CreateInstance(elementType, numElements);
        int index = 0;
        foreach (object elementValue in elements) {
            object o = ConvertToType(elementValue, elementType, src);
            array.SetValue(o, index);
            ++index;
        }
        return array;
    }

    private Dictionary<System.Type, CustomCreator> m_creators;
};

public class Serializer {

    public static string Serialize(object obj, bool includeTypeInfoForDerivedTypes = false) {
        Serializer s = new Serializer(includeTypeInfoForDerivedTypes);
        s.SerializeValue(obj);
        return s.GetJson();
    }

    private Serializer(bool includeTypeInfoForDerivedTypes) {
        m_builder = new StringBuilder();
        m_includeTypeInfoForDerivedTypes = includeTypeInfoForDerivedTypes;
    }

    private string GetJson() {
        return m_builder.ToString();
    }

    private StringBuilder m_builder;
    private bool m_includeTypeInfoForDerivedTypes;

    private void SerializeValue(object obj) {
        System.Type type = obj.GetType();

        if (type.IsArray) {
            SerializeArray(obj);
        } else if (type == typeof(string)) {
            SerializeString(obj as string);
        } else if (type == typeof(int)) {
            m_builder.Append(obj);
        } else if (type == typeof(float)) {
            m_builder.Append(((float)obj).ToString("R", System.Globalization.CultureInfo.InvariantCulture));
        } else if (type == typeof(double)) {
            m_builder.Append(((double)obj).ToString("R", System.Globalization.CultureInfo.InvariantCulture));
        } else if (type == typeof(bool)) {
            m_builder.Append((bool)obj ? "true" : "false");
        } else if (type.IsClass) {
            SerializeObject(obj);
        } else {
            throw new System.InvalidOperationException("unsupport type: " + type.Name);
        }
    }

    private void SerializeArray(object obj) {
        m_builder.Append("[");
        Array array = obj as Array;
        bool first = true;
        foreach (object element in array) {
            if (!first) {
                m_builder.Append(",");
            }
            SerializeValue(element);
            first = false;
        }
        m_builder.Append("]");
    }

    private void SerializeObject(object obj) {
        m_builder.Append("{");
        bool first = true;
        if (m_includeTypeInfoForDerivedTypes) {
            // Only inlcude type info for derived types.
            System.Type type = obj.GetType();
            System.Type baseType = type.BaseType;
            if (baseType != null && baseType != typeof(System.Object)) {
                SerializeString("$dotNetType");  // assuming this won't clash with user's properties.
                m_builder.Append(":");
                SerializeString(type.FullName);
            }
        }
        System.Reflection.FieldInfo[] fields = obj.GetType().GetFields();
        foreach (System.Reflection.FieldInfo info in fields) {
            if (!first) {
                m_builder.Append(",");
            }
            SerializeString(info.Name);
            m_builder.Append(":");
            object fieldValue = info.GetValue(obj);
            SerializeValue(fieldValue);
            first = false;
        }
        m_builder.Append("}");
    }

    private void SerializeString(string str) {
        m_builder.Append('\"');

        char[] charArray = str.ToCharArray();
        foreach (var c in charArray) {
            switch (c) {
            case '"':
                m_builder.Append("\\\"");
                break;
            case '\\':
                m_builder.Append("\\\\");
                break;
            case '\b':
                m_builder.Append("\\b");
                break;
            case '\f':
                m_builder.Append("\\f");
                break;
            case '\n':
                m_builder.Append("\\n");
                break;
            case '\r':
                m_builder.Append("\\r");
                break;
            case '\t':
                m_builder.Append("\\t");
                break;
            default:
                int codepoint = Convert.ToInt32(c);
                if ((codepoint >= 32) && (codepoint <= 126)) {
                    m_builder.Append(c);
                } else {
                    m_builder.Append("\\u");
                    m_builder.Append(codepoint.ToString("x4"));
                }
                break;
            }
        }

        m_builder.Append('\"');
    }
}

}  // namespace DeJson

