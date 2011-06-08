package org.onehippo.cms7.channelmanager.channels;

import java.io.Serializable;

public class Channel implements Serializable {

    private String title;
    private String url; //Probably not needed for all channels ?
    private String type; //Channel type - preview/live.
    private String hstConfigPath;
    private String contentRoot;

    private Channel parent;  //The parent channel, null if this is the root

    public Channel(String title) {
        this.title = title;
    }

    public Channel getParent() {
        return parent;
    }

    public void setParent(Channel parent) {
        this.parent = parent;
    }

    public String getContentRoot() {
        return contentRoot;
    }

    public void setContentRoot(String contentRoot) {
        this.contentRoot = contentRoot;
    }

    public String getHstConfigPath() {
        return hstConfigPath;
    }

    public void setHstConfigPath(String hstConfigPath) {
        this.hstConfigPath = hstConfigPath;
    }


    public String getTitle() {
        if(this.parent == null) return "/";
        return parent.getTitle() + "/" + title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    @Override
    public String toString() {
        return "Channel{" +
                "title='" + title + '\'' +
                ", url='" + url + '\'' +
                ", type='" + type + '\'' +
                ", hstConfigPath='" + hstConfigPath + '\'' +
                ", contentRoot='" + contentRoot + '\'' +
                ", parent=" + parent +
                '}';
    }
}
