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

class DPadEmuJS {

    private var Left : int = 1;
    private var Right : int = 2;
    private var Up : int = 4;
    private var Down : int = 8;

    class DirInfo {
        public function DirInfo(_dx : int, _dy : int, _bits : int) {
            bits = _bits;
            dx = _dx;
            dy = _dy;
        }
        var dx : int;
        var dy : int;
        var bits : int;
    };

    public function DPadEmuJS() {
        m_pads = new int[2];
        m_pads[0] = -1;
        m_pads[1] = -1;

        if (s_dirToInfo == null) {
            s_dirToInfo = new DirInfo[9];
            s_dirToInfo[0] = new DirInfo(0, 0, 0);
            s_dirToInfo[0 + 1] = new DirInfo( 1,  0, Right);
            s_dirToInfo[1 + 1] = new DirInfo( 1,  1, Right | Up);
            s_dirToInfo[2 + 1] = new DirInfo( 0,  1, Up);
            s_dirToInfo[3 + 1] = new DirInfo(-1,  1, Left | Up);
            s_dirToInfo[4 + 1] = new DirInfo(-1,  0, Left);
            s_dirToInfo[5 + 1] = new DirInfo(-1, -1, Left | Down);
            s_dirToInfo[6 + 1] = new DirInfo( 0, -1, Down);
            s_dirToInfo[7 + 1] = new DirInfo( 1, -1, Right | Down);
        }
    }

    private function GetDirInfo(pad : int) : DirInfo {
        return s_dirToInfo[m_pads[pad] + 1];
    }

    function Update(pad : int, dir : int) {
        m_pads[pad] = dir;
    }

    function GetAxisRaw(id : String) : float {
        var info : DirInfo = GetDirInfo(0);
        if (id.Equals("Horizontal")) {
            return info.dx;
        }
        if (id.Equals("Vertical")) {
            return info.dy;
        }
        return 0;
    }

    function GetButton(id : String) : boolean {
        // Not implemented
        return false;
    }

    function GetButtonDown(id : String) : boolean {
        // Not implemented
        return false;
    }

    function GetKey(id : String) : boolean {
        // Not implemented
        return false;
    }

    function GetKey(id : KeyCode) : boolean {
        // Not implemented
        return false;
    }

    function ResetInputAxes() {
        // Not implemented
        return false;
    }

    private var m_pads : int[];
    static private var s_dirToInfo : DirInfo[];
};


